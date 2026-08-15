import express from 'express';
import { getCustomers, updateCustomerStatus } from '../controllers/userController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/customers', protect, adminOnly, getCustomers);
router.put('/customers/:id/status', protect, adminOnly, updateCustomerStatus);

export default router;
