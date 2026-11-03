import mongoose from 'mongoose';

const TRANSACTION_ERROR =
  'MongoDB transactions are unavailable. Configure MongoDB as a replica set (see backend/README.md) or use MongoDB Atlas.';

export const ensureTransactionSupport = async () => {
  const hello = await mongoose.connection.db.admin().command({ hello: 1 });
  if (!hello.setName && hello.msg !== 'isdbgrid') {
    const error = new Error(TRANSACTION_ERROR);
    error.statusCode = 503;
    throw error;
  }
};
