import express from 'express';
import { 
  createInquiry, 
  getMyInquiries, 
  getMyInquiryById, 
  getAllInquiriesAdmin, 
  getInquiryByIdAdmin, 
  updateInquiryStatus, 
  saveAdminResponse, 
  saveAdminNotes 
} from '../controllers/inquiryController.js';
import { protect, adminOnly, optionalProtect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public / Customer Creation Flow (Optional auth to grab auth.uid() if logged in)
router.post('/', optionalProtect, createInquiry);

// Customer Portal Endpoints (Authenticated)
router.get('/my-inquiries', protect, getMyInquiries);
router.get('/my-inquiries/:id', protect, getMyInquiryById);

// Admin Management Endpoints (Admin Only)
router.get('/admin/all', protect, adminOnly, getAllInquiriesAdmin);
router.get('/admin/:id', protect, adminOnly, getInquiryByIdAdmin);
router.patch('/admin/:id/status', protect, adminOnly, updateInquiryStatus);
router.patch('/admin/:id/response', protect, adminOnly, saveAdminResponse);
router.patch('/admin/:id/notes', protect, adminOnly, saveAdminNotes);

export default router;
