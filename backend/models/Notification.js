import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // null for admin broadcasts
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['order', 'payment', 'stock', 'system', 'review'], default: 'order' },
    isRead: { type: Boolean, default: false },
    isAdmin: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('Notification', notificationSchema);
