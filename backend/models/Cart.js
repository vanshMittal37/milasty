import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  variantName: { type: String, required: true },
  weight: { type: String },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, default: 1 },
});

const cartSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: [cartItemSchema],
  },
  { timestamps: true }
);

export default mongoose.model('Cart', cartSchema);
