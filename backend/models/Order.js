import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  title: { type: String, required: true },
  variantName: { type: String, required: true },
  weight: { type: String },
  originalPrice: { type: Number, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
});

const timelineSchema = new mongoose.Schema({
  status: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  note: { type: String },
});

const orderSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    customerName: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    shippingAddress: {
      addressLine: { type: String, required: true },
      building: { type: String },
      city: { type: String, required: true },
      state: { type: String, required: true },
      country: { type: String, default: 'India' },
      pincode: { type: String, required: true },
    },
    items: [orderItemSchema],
    subtotal: { type: Number, required: true },
    discountAmount: { type: Number, default: 0 },
    couponCode: { type: String },
    couponDiscount: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    paymentMethod: { type: String, enum: ['Razorpay', 'COD', 'WhatsApp'], default: 'Razorpay' },
    paymentStatus: { type: String, enum: ['Pending', 'Paid', 'Failed', 'Refunded'], default: 'Pending' },
    orderStatus: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Processing', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'],
      default: 'Pending',
    },
    orderTimeline: [timelineSchema],
    cancellationReason: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model('Order', orderSchema);
