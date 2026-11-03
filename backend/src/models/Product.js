import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, trim: true },
    barcode: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['Grocery', 'Beverages', 'Electronics', 'Fitness', 'Accessories', 'Home'],
      default: 'Grocery',
    },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    threshold: { type: Number, default: 15 },
    description: { type: String, default: '' },
    imageUrl: {
      type: String,
      trim: true,
      default: '',
      validate: {
        validator: (value) => !value || /^https?:\/\/\S+$/i.test(value),
        message: 'Image URL must start with http:// or https://',
      },
    },
    sold: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
    warehouse: { type: String, default: 'Warehouse A' },
    store: { type: String, default: 'Central Flagship' },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
  },
  { timestamps: true },
);

productSchema.index({ name: 'text', sku: 'text', barcode: 'text' });
productSchema.index({ tenant: 1, sku: 1 }, { unique: true });
productSchema.index({ tenant: 1, barcode: 1 }, { unique: true });

const Product = mongoose.model('Product', productSchema);

export default Product;
