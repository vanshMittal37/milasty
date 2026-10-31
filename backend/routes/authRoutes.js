import express from 'express';
import {
  registerUser,
  loginUser,
  getMe,
  addAddress,
  deleteAddress,
  forgotPassword,
  resetPassword,
  changePassword,
  updateProfile,
  updateAddress,
  setDefaultAddress,
  sendSignupOtp,
  verifySignupOtp,
  sendForgotPasswordOtp,
  verifyForgotPasswordOtp,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/signup/send-otp', sendSignupOtp);
router.post('/signup/verify-otp', verifySignupOtp);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.post('/address', protect, addAddress);
router.delete('/address/:addressId', protect, deleteAddress);
router.post('/forgot-password', forgotPassword);
router.post('/forgot-password/send-otp', sendForgotPasswordOtp);
router.post('/forgot-password/verify-otp', verifyForgotPasswordOtp);
router.post('/reset-password', resetPassword);
router.put('/change-password', protect, changePassword);
router.put('/profile', protect, updateProfile);
router.put('/address/:addressId', protect, updateAddress);
router.put('/address/:addressId/default', protect, setDefaultAddress);

export default router;


