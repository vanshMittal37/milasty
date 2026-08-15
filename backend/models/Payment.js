import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: ['pending', 'authorized', 'captured', 'failed', 'refunded'],
      default: 'pending',
    },
    method: { type: String, default: 'Razorpay' },
  },
  { timestamps: true }
);

export default mongoose.model('Payment', paymentSchema);
