import express from 'express';
import {
  checkServiceability,
  getDeliveryAreas,
  createDeliveryArea,
  updateDeliveryArea,
  deleteDeliveryArea,
  lookupPincodeDetails,
} from '../controllers/deliveryAreaController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public Customer Endpoint: Serviceability Check by PIN Code
router.get('/check/:pincode', checkServiceability);

// Admin Helper Endpoint: India Post PIN Code Details Lookup
router.get('/lookup-pincode/:pincode', protect, adminOnly, lookupPincodeDetails);

// Admin Management Endpoints (CRUD)
router.get('/', protect, adminOnly, getDeliveryAreas);
router.post('/', protect, adminOnly, createDeliveryArea);
router.put('/:id', protect, adminOnly, updateDeliveryArea);
router.delete('/:id', protect, adminOnly, deleteDeliveryArea);

export default router;
