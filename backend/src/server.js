import dotenv from 'dotenv';

dotenv.config();

import connectDB from './config/db.js';
import app from './app.js';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not set. Add a private secret to backend/.env.');
  }

  if (process.env.NODE_ENV === 'production' && (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM)) {
    throw new Error('RESEND_API_KEY and EMAIL_FROM are required in production for password reset emails.');
  }

  await connectDB();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Smart Retail POS API running on http://localhost:${PORT}`);
  });
};

startServer().catch((error) => {
  console.error(`Server startup failed: ${error.message}`);
  process.exitCode = 1;
});
