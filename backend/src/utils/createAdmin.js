import 'dotenv/config';
import mongoose from 'mongoose';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import connectDB from '../config/db.js';
import User from '../models/User.js';

const prompt = createInterface({ input, output });

const createAdmin = async () => {
  try {
    const name = (await prompt.question('Admin name: ')).trim();
    const email = (await prompt.question('Admin email: ')).trim().toLowerCase();
    const password = await prompt.question('Admin password (at least 6 characters): ');

    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 6) {
      throw new Error('Name, valid email and a password of at least 6 characters are required.');
    }

    await connectDB();

    if (await User.exists({ email })) {
      throw new Error(`An account with ${email} already exists.`);
    }

    await User.create({ name, email, password, role: 'Admin' });
    console.log(`Admin account created for ${email}. You can now sign in.`);
  } catch (error) {
    console.error(`Admin setup failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    prompt.close();
    await mongoose.disconnect();
  }
};

createAdmin();
