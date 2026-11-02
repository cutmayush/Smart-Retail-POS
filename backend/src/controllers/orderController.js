import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
import crypto from 'crypto';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import InventoryLog from '../models/InventoryLog.js';

const generateOrderNumber = () => `ORD-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
let transactionSupport;

const supportsTransactions = async () => {
  if (!transactionSupport) {
    transactionSupport = mongoose.connection.db.admin().command({ hello: 1 })
      .then((hello) => Boolean(hello.setName || hello.msg === 'isdbgrid'))
      .catch((error) => {
        transactionSupport = null;
        throw error;
      });
  }
  return transactionSupport;
};

const requireTransactionSupport = async (res) => {
  if (!(await supportsTransactions())) {
    res.status(503);
    throw new Error(
      'MongoDB transactions are unavailable. Configure MongoDB as replica set "rs0" (see backend/README.md) or use MongoDB Atlas.',
    );
  }
};

// @route  GET /api/orders
// @access Private
export const getOrders = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = {};
  if (status && status !== 'All') filter.status = status;

  const orders = await Order.find(filter).sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: orders.length, orders });
});

// @route  GET /api/orders/:id
// @access Private
export const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  res.status(200).json({ success: true, order });
});

// @route  POST /api/orders/checkout
// @access Private
// Body: { items: [{ productId, quantity }], customer, payment }
// Mirrors POSPage.jsx pricing logic: subtotal -> 18% GST -> 5% discount if subtotal > 5000
export const checkoutOrder = asyncHandler(async (req, res) => {
  const { items, customer, payment } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    res.status(400);
    throw new Error('Cart items are required to checkout');
  }

  if (payment && !['Cash', 'Card', 'UPI'].includes(payment)) {
    res.status(400);
    throw new Error('Payment must be Cash, Card or UPI');
  }

  const quantitiesByProduct = new Map();
  for (const item of items) {
    const quantity = Number(item?.quantity);
    if (
      typeof item?.productId !== 'string'
      || !mongoose.isValidObjectId(item.productId)
      || !Number.isSafeInteger(quantity)
      || quantity < 1
    ) {
      res.status(400);
      throw new Error('Each cart item needs a valid product and a positive whole-number quantity');
    }
    quantitiesByProduct.set(
      item.productId,
      (quantitiesByProduct.get(item.productId) || 0) + quantity,
    );
  }

  await requireTransactionSupport(res);
  const session = await mongoose.startSession();
  try {
    let order;
    await session.withTransaction(async () => {
      const orderItems = [];
      let subtotal = 0;

      for (const [productId, quantity] of quantitiesByProduct) {
        const product = await Product.findById(productId).session(session);
        if (!product) {
          res.status(404);
          throw new Error('A product in this cart no longer exists');
        }
        if (product.stock < quantity) {
          res.status(400);
          throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}`);
        }

        product.stock -= quantity;
        product.sold += quantity;
        product.revenue += product.price * quantity;
        await product.save({ session });

        await InventoryLog.create(
          [{
            product: product._id,
            warehouse: product.warehouse,
            store: product.store,
            change: -quantity,
            reason: 'POS sale',
            resultingStock: product.stock,
          }],
          { session },
        );

        orderItems.push({
          product: product._id,
          name: product.name,
          sku: product.sku,
          price: product.price,
          quantity,
        });
        subtotal += product.price * quantity;
      }

      const gst = subtotal * 0.18;
      const discount = subtotal > 5000 ? subtotal * 0.05 : 0;
      const total = subtotal + gst - discount;
      const [createdOrder] = await Order.create(
        [{
          orderNumber: generateOrderNumber(),
          customer: typeof customer === 'string' && customer.trim() ? customer.trim() : 'Walk-in Customer',
          items: orderItems,
          itemsCount: orderItems.reduce((sum, item) => sum + item.quantity, 0),
          subtotal,
          gst,
          discount,
          total,
          payment: payment || 'Cash',
          status: 'Completed',
          createdBy: req.user._id,
          store: req.user.store,
        }],
        { session },
      );
      order = createdOrder;
    });
    res.status(201).json({ success: true, order });
  } finally {
    await session.endSession();
  }
});

// @route  PUT /api/orders/:id/status
// @access Private
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['Pending', 'Processing', 'Completed', 'Cancelled'];

  if (!validStatuses.includes(status)) {
    res.status(400);
    throw new Error(`Status must be one of: ${validStatuses.join(', ')}`);
  }

  if (status !== 'Cancelled') {
    const order = await Order.findById(req.params.id);
    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }
    if (order.status === status) {
      res.status(200).json({ success: true, order });
      return;
    }
    if (order.status === 'Completed' || order.status === 'Cancelled') {
      res.status(400);
      throw new Error(`${order.status} orders cannot be changed`);
    }
    if (
      (order.status === 'Pending' && !['Processing', 'Completed'].includes(status))
      || (order.status === 'Processing' && status !== 'Completed')
    ) {
      res.status(400);
      throw new Error(`An order cannot move from ${order.status} to ${status}`);
    }

    order.status = status;
    await order.save();
    res.status(200).json({ success: true, order });
    return;
  }

  const currentOrder = await Order.findById(req.params.id);
  if (!currentOrder) {
    res.status(404);
    throw new Error('Order not found');
  }
  if (currentOrder.status === 'Cancelled') {
    res.status(200).json({ success: true, order: currentOrder });
    return;
  }
  if (currentOrder.status === 'Completed') {
    res.status(400);
    throw new Error('Completed orders cannot be changed');
  }
  await requireTransactionSupport(res);

  const session = await mongoose.startSession();
  try {
    let updatedOrder;
    await session.withTransaction(async () => {
      const order = await Order.findById(req.params.id).session(session);
      if (!order) {
        res.status(404);
        throw new Error('Order not found');
      }
      if (order.status === status) {
        updatedOrder = order;
        return;
      }
      if (order.status === 'Completed' || order.status === 'Cancelled') {
        res.status(400);
        throw new Error(`${order.status} orders cannot be changed`);
      }

      if (status === 'Cancelled') {
        for (const item of order.items) {
          const product = await Product.findById(item.product).session(session);
          if (!product) continue;

          product.stock += item.quantity;
          product.sold = Math.max(0, product.sold - item.quantity);
          product.revenue = Math.max(0, product.revenue - item.price * item.quantity);
          await product.save({ session });
          await InventoryLog.create(
            [{
              product: product._id,
              warehouse: product.warehouse,
              store: product.store,
              change: item.quantity,
              reason: `Order ${order.orderNumber} cancelled`,
              resultingStock: product.stock,
            }],
            { session },
          );
        }
      }

      order.status = status;
      await order.save({ session });
      updatedOrder = order;
    });
    res.status(200).json({ success: true, order: updatedOrder });
  } finally {
    await session.endSession();
  }
});

// @route  GET /api/orders/recent?limit=5
// @access Private
export const getRecentTransactions = asyncHandler(async (req, res) => {
  const limit = Number(req.query.limit) || 5;
  const orders = await Order.find().sort({ createdAt: -1 }).limit(limit);
  res.status(200).json({ success: true, orders });
});
