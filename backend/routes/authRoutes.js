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
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.post('/address', protect, addAddress);
router.delete('/address/:addressId', protect, deleteAddress);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.put('/change-password', protect, changePassword);
router.put('/profile', protect, updateProfile);
router.put('/address/:addressId', protect, updateAddress);
router.put('/address/:addressId/default', protect, setDefaultAddress);

export default router;


