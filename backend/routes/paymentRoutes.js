import express from 'express';
import {
  createPaymentSession,
  createRazorpayOrder,
  verifyRazorpayPayment,
  cancelPaymentSession,
  failPaymentSession,
  handleRazorpayWebhook,
} from '../controllers/paymentController.js';

import { optionalProtect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/create-session', optionalProtect, createPaymentSession);
router.post('/create', optionalProtect, createRazorpayOrder);
router.post('/verify', optionalProtect, verifyRazorpayPayment);
router.post('/cancel', cancelPaymentSession);
router.post('/fail', failPaymentSession);
router.post('/webhook', handleRazorpayWebhook);

export default router;
