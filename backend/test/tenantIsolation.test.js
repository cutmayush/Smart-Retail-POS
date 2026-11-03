import assert from 'node:assert/strict';
import { test } from 'node:test';
import InventoryLog from '../src/models/InventoryLog.js';
import Order from '../src/models/Order.js';
import Product from '../src/models/Product.js';
import Store from '../src/models/Store.js';
import User from '../src/models/User.js';

test('business schemas require a tenant and scope unique identifiers', () => {
  for (const Model of [User, Product, Order, InventoryLog]) {
    assert.equal(Model.schema.path('tenant').options.required, true, `${Model.modelName} requires tenant`);
  }

  const productIndexes = Product.schema.indexes();
  assert(productIndexes.some(([keys, options]) => (
    keys.tenant === 1 && keys.sku === 1 && options.unique
  )));
  assert(productIndexes.some(([keys, options]) => (
    keys.tenant === 1 && keys.barcode === 1 && options.unique
  )));
  assert(Order.schema.indexes().some(([keys, options]) => (
    keys.tenant === 1 && keys.orderNumber === 1 && options.unique
  )));
  assert.equal(Store.schema.path('name').options.required, true);
});

test('store signup, roles, login, and API tenant isolation', {
  skip: !process.env.TEST_MONGO_URI,
}, async () => {
  process.env.MONGO_URI = process.env.TEST_MONGO_URI;
  process.env.JWT_SECRET = 'tenant-isolation-integration-test-secret';
  process.env.NODE_ENV = 'test';

  const [
    { default: connectDB },
    { default: app },
    { default: Store },
    { default: User },
    { default: Product },
    { default: Order },
    { default: InventoryLog },
  ] = await Promise.all([
    import('../src/config/db.js'),
    import('../src/app.js'),
    import('../src/models/Store.js'),
    import('../src/models/User.js'),
    import('../src/models/Product.js'),
    import('../src/models/Order.js'),
    import('../src/models/InventoryLog.js'),
  ]);

  await connectDB();
  await Promise.all([
    Store.init(),
    User.init(),
    Product.init(),
    Order.init(),
    InventoryLog.init(),
  ]);

  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}/api`;
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const tenantIds = [];

  const request = async (path, { method = 'GET', token, body } = {}) => {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return { status: response.status, data: await response.json() };
  };

  try {
    const signup = async (email, storeName) => request('/auth/register', {
      method: 'POST',
      body: {
        name: `Owner ${storeName}`,
        storeName,
        email,
        password: 'secure-test-password',
        passwordConfirm: 'secure-test-password',
      },
    });

    const first = await signup(`owner-${suffix}@example.test`, `Store One ${suffix}`);
    if (first.data.user?.storeId) tenantIds.push(first.data.user.storeId);
    const second = await signup(`owner-two-${suffix}@example.test`, `Store Two ${suffix}`);
    if (second.data.user?.storeId) tenantIds.push(second.data.user.storeId);
    assert.equal(first.status, 201);
    assert.equal(second.status, 201);
    assert.equal(first.data.user.role, 'Admin');
    assert.equal(second.data.user.role, 'Admin');
    assert.notEqual(first.data.user.storeId, second.data.user.storeId);
    const firstStore = await Store.findById(first.data.user.storeId);
    assert.equal(firstStore.owner.toString(), first.data.user.id);

    const manager = await request('/users', {
      method: 'POST',
      token: first.data.token,
      body: {
        name: 'Test Manager',
        email: `manager-${suffix}@example.test`,
        password: 'secure-test-password',
        role: 'Manager',
        tenant: second.data.user.storeId,
      },
    });
    const cashier = await request('/users', {
      method: 'POST',
      token: first.data.token,
      body: {
        name: 'Test Cashier',
        email: `cashier-${suffix}@example.test`,
        password: 'secure-test-password',
        role: 'Cashier',
      },
    });
    assert.equal(manager.status, 201);
    assert.equal(cashier.status, 201);
    assert.equal(manager.data.user.storeId, first.data.user.storeId);
    assert.equal(cashier.data.user.role, 'Cashier');
    const secondTeam = await request('/users', { token: second.data.token });
    assert.equal(secondTeam.data.count, 1);
    assert.equal(secondTeam.data.users[0].storeId, second.data.user.storeId);

    const productData = {
      name: `Test Product ${suffix}`,
      sku: `SKU-${suffix}`,
      barcode: `BAR-${suffix}`,
      price: 10,
      stock: 5,
    };
    const firstProduct = await request('/products', {
      method: 'POST',
      token: first.data.token,
      body: { ...productData, tenant: second.data.user.storeId },
    });
    const secondProduct = await request('/products', {
      method: 'POST',
      token: second.data.token,
      body: { ...productData, name: `Other Tenant Product ${suffix}` },
    });
    assert.equal(firstProduct.status, 201);
    assert.equal(secondProduct.status, 201);
    assert.equal(firstProduct.data.product.tenant, first.data.user.storeId);
    assert.equal(secondProduct.data.product.tenant, second.data.user.storeId);

    const firstProductId = firstProduct.data.product._id;
    const secondProductId = secondProduct.data.product._id;
    const managerLogin = await request('/auth/login', {
      method: 'POST',
      body: { email: manager.data.user.email, password: 'secure-test-password' },
    });
    const cashierLogin = await request('/auth/login', {
      method: 'POST',
      body: { email: cashier.data.user.email, password: 'secure-test-password' },
    });
    assert.equal(managerLogin.status, 200);
    assert.equal(cashierLogin.status, 200);

    const firstProducts = await request('/products', { token: cashierLogin.data.token });
    const secondProducts = await request('/products', { token: second.data.token });
    const secondInventory = await request('/inventory', { token: second.data.token });
    assert.deepEqual(firstProducts.data.products.map((product) => product._id), [firstProductId]);
    assert.deepEqual(secondProducts.data.products.map((product) => product._id), [secondProductId]);
    assert.deepEqual(secondInventory.data.items.map((item) => item.productId), [secondProductId]);

    const foreignProduct = await request(`/products/${firstProductId}`, { token: second.data.token });
    const foreignProductUpdate = await request(`/products/${firstProductId}`, {
      method: 'PUT',
      token: second.data.token,
      body: { price: 99 },
    });
    const foreignProductDelete = await request(`/products/${firstProductId}`, {
      method: 'DELETE',
      token: second.data.token,
    });
    const foreignStockChange = await request(`/inventory/${firstProductId}/stock`, {
      method: 'PUT',
      token: managerLogin.data.token,
      body: { delta: 1 },
    });
    const foreignInventoryLogs = await request(`/inventory/${firstProductId}/logs`, {
      token: second.data.token,
    });
    assert.equal(foreignProduct.status, 404);
    assert.equal(foreignProductUpdate.status, 404);
    assert.equal(foreignProductDelete.status, 404);
    assert.equal(foreignStockChange.status, 404);
    assert.equal(foreignInventoryLogs.status, 404);

    const checkout = await request('/orders/checkout', {
      method: 'POST',
      token: cashierLogin.data.token,
      body: { items: [{ productId: firstProductId, quantity: 1 }] },
    });
    const foreignCheckout = await request('/orders/checkout', {
      method: 'POST',
      token: second.data.token,
      body: { items: [{ productId: firstProductId, quantity: 1 }] },
    });
    assert.equal(checkout.status, 201);
    assert.equal(foreignCheckout.status, 404);

    const foreignOrder = await request(`/orders/${checkout.data.order._id}`, {
      token: second.data.token,
    });
    const foreignOrderUpdate = await request(`/orders/${checkout.data.order._id}/status`, {
      method: 'PUT',
      token: second.data.token,
      body: { status: 'Cancelled' },
    });
    const secondStoreOrders = await request('/orders', { token: second.data.token });
    const secondStoreStats = await request('/dashboard/stats', { token: second.data.token });
    const firstStoreStats = await request('/dashboard/stats', { token: first.data.token });
    const secondStoreReport = await request('/dashboard/report-highlights', { token: second.data.token });
    assert.equal(foreignOrder.status, 404);
    assert.equal(foreignOrderUpdate.status, 404);
    assert.equal(secondStoreOrders.data.count, 0);
    assert.equal(secondStoreStats.data.statCards.find((card) => card.title === 'Total Orders').value, 0);
    assert.equal(firstStoreStats.data.statCards.find((card) => card.title === 'Total Orders').value, 1);
    assert.equal(secondStoreReport.data.reportHighlights.find((item) => item.label === 'Monthly Revenue').value, 0);

    const foreignTeamMember = await request(`/users/${manager.data.user.id}`, {
      method: 'DELETE',
      token: second.data.token,
    });
    const unauthenticated = await request('/products');
    assert.equal(foreignTeamMember.status, 404);
    assert.equal(unauthenticated.status, 401);

    const existingUser = await User.create({
      name: 'Existing Login User',
      email: `existing-${suffix}@example.test`,
      password: 'legacy-password',
      role: 'Cashier',
      tenant: first.data.user.storeId,
    });
    const existingLogin = await request('/auth/login', {
      method: 'POST',
      body: { email: existingUser.email, password: 'legacy-password' },
    });
    assert.equal(existingLogin.status, 200);
    assert.equal(existingLogin.data.user.id, existingUser._id.toString());
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    if (tenantIds.length) {
      await Promise.all([
        InventoryLog.deleteMany({ tenant: { $in: tenantIds } }),
        Order.deleteMany({ tenant: { $in: tenantIds } }),
        Product.deleteMany({ tenant: { $in: tenantIds } }),
        User.deleteMany({ tenant: { $in: tenantIds } }),
        Store.deleteMany({ _id: { $in: tenantIds } }),
      ]);
    }
    const { default: mongoose } = await import('mongoose');
    await mongoose.disconnect();
  }
});
