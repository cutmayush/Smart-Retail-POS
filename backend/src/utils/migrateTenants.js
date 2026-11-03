import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import InventoryLog from '../models/InventoryLog.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Store from '../models/Store.js';
import User from '../models/User.js';

const migrateTenants = async () => {
  try {
    await connectDB();

    let legacyStore = await Store.findOne({ isLegacy: true });
    if (!legacyStore) {
      legacyStore = await Store.create({ name: 'Legacy Store', isLegacy: true });
    }

    const models = [Product, Order, InventoryLog];
    for (const Model of models) {
      const result = await Model.updateMany(
        { $or: [{ tenant: { $exists: false } }, { tenant: null }] },
        { $set: { tenant: legacyStore._id } },
      );
      console.log(`${Model.modelName}: assigned ${result.modifiedCount} legacy records`);
    }

    const users = await User.updateMany(
      { $or: [{ tenant: { $exists: false } }, { tenant: null }] },
      { $set: { tenant: legacyStore._id } },
    );
    console.log(`User: assigned ${users.modifiedCount} legacy records`);

    const legacyOwner = await User.findOne({ tenant: legacyStore._id, role: 'Admin' }).sort({ createdAt: 1 });
    if (legacyOwner && !legacyStore.owner) {
      legacyStore.owner = legacyOwner._id;
      await legacyStore.save();
    }

    for (const Model of [Product, Order]) {
      await Model.createIndexes();
      const indexes = await Model.collection.indexes();
      const fields = Model === Product ? ['sku', 'barcode'] : ['orderNumber'];
      for (const field of fields) {
        for (const index of indexes) {
          const keys = Object.keys(index.key || {});
          if (index.unique && keys.length === 1 && keys[0] === field && index.key[field] === 1) {
            await Model.collection.dropIndex(index.name);
            console.log(`${Model.modelName}: removed global unique index ${index.name}`);
          }
        }
      }
    }
    await Promise.all([InventoryLog.createIndexes(), User.createIndexes(), Store.createIndexes()]);

    console.log('Tenant migration completed.');
  } finally {
    await mongoose.disconnect();
  }
};

migrateTenants().catch((error) => {
  console.error(`Tenant migration failed: ${error.message}`);
  process.exitCode = 1;
});
