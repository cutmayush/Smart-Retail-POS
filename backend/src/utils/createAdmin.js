import 'dotenv/config';
import mongoose from 'mongoose';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import connectDB from '../config/db.js';
import Store from '../models/Store.js';
import User from '../models/User.js';
import { ensureTransactionSupport } from './ensureTransactionSupport.js';

const prompt = createInterface({ input, output });

const createAdmin = async () => {
  try {
    const name = (await prompt.question('Admin name: ')).trim();
    const email = (await prompt.question('Admin email: ')).trim().toLowerCase();
    const storeName = (await prompt.question('Store name: ')).trim();
    const password = await prompt.question('Admin password (at least 8 characters): ');

    if (!name || !storeName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8) {
      throw new Error('Name, store name, valid email and a password of at least 8 characters are required.');
    }

    await connectDB();

    if (await User.exists({ email })) {
      throw new Error(`An account with ${email} already exists.`);
    }

    await ensureTransactionSupport();
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const [store] = await Store.create([{ name: storeName }], { session });
        const [user] = await User.create(
          [{ name, email, password, role: 'Admin', tenant: store._id, store: storeName }],
          { session },
        );
        store.owner = user._id;
        await store.save({ session });
      });
    } finally {
      await session.endSession();
    }
    console.log(`Admin account and store created for ${email}. You can now sign in.`);
  } catch (error) {
    console.error(`Admin setup failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    prompt.close();
    await mongoose.disconnect();
  }
};

createAdmin();
