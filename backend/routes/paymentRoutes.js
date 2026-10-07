import express from 'express';
import {
  createPaymentSession,
  createRazorpayOrder,
  verifyRazorpayPayment,
  cancelPaymentSession,
  failPaymentSession,
  handleRazorpayWebhook,
} from '../controllers/paymentController.js';

import { protect, optionalProtect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Checkout requires a logged-in customer: the server-side cart is the source of truth
router.post('/create-session', protect, createPaymentSession);
router.post('/create', protect, createRazorpayOrder);
router.post('/verify', optionalProtect, verifyRazorpayPayment);
router.post('/cancel', cancelPaymentSession);
router.post('/fail', failPaymentSession);
router.post('/webhook', handleRazorpayWebhook);

export default router;
