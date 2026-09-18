import express from 'express';
import {
  createPaymentSession,
  createRazorpayOrder,
  verifyRazorpayPayment,
  cancelPaymentSession,
  failPaymentSession,
  handleRazorpayWebhook,
} from '../controllers/paymentController.js';

const router = express.Router();

router.post('/create-session', createPaymentSession);
router.post('/create', createRazorpayOrder);
router.post('/verify', verifyRazorpayPayment);
router.post('/cancel', cancelPaymentSession);
router.post('/fail', failPaymentSession);
router.post('/webhook', handleRazorpayWebhook);

export default router;
