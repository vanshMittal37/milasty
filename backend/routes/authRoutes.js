import express from 'express';
import {
  registerUser,
  loginUser,
  getMe,
  addAddress,
  deleteAddress,
  forgotPassword,
  updateProfile,
  updateAddress,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.post('/address', protect, addAddress);
router.delete('/address/:addressId', protect, deleteAddress);
router.post('/forgot-password', forgotPassword);
router.put('/profile', protect, updateProfile);
router.put('/address/:addressId', protect, updateAddress);

export default router;
