import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    location: { type: String, default: 'India' },
    rating: { type: Number, required: true, default: 5 },
    comment: { type: String, required: true },
    verifiedPurchase: { type: Boolean, default: true },
    productName: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model('Review', reviewSchema);
