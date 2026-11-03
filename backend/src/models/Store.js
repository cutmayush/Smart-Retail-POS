import mongoose from 'mongoose';

const storeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isLegacy: { type: Boolean, default: false },
  },
  { timestamps: true },
);

storeSchema.index(
  { isLegacy: 1 },
  { unique: true, partialFilterExpression: { isLegacy: true } },
);

const Store = mongoose.model('Store', storeSchema);

export default Store;
