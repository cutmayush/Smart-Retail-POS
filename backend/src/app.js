import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

const app = express();
dotenv.config();

const allowedClientOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => {
    const value = origin.trim();
    if (!value) return null;

    try {
      return new URL(value.includes('://') ? value : `https://${value}`).origin;
    } catch {
      throw new Error(`Invalid CLIENT_ORIGIN value: ${value}`);
    }
  })
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedClientOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Origin is not allowed by CORS'));
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (_req, res) => {
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({ status: 'unavailable', database: 'disconnected' });
    return;
  }

  res.status(200).json({ status: 'ok', database: 'connected' });
});

app.get('/', (req, res) => {
  res.json({ success: true, message: 'Smart Retail POS API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
