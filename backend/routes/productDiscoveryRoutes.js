import express from 'express';
import {
  getPublicProductDiscovery,
  getAdminProductDiscovery,
  updateSectionConfig,
  createMood,
  updateMood,
  deleteMood,
  reorderMoods,
} from '../controllers/productDiscoveryController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', getPublicProductDiscovery);

// Admin routes
router.get('/admin', protect, adminOnly, getAdminProductDiscovery);
router.put('/admin/section', protect, adminOnly, updateSectionConfig);
router.post('/admin/moods', protect, adminOnly, createMood);
router.put('/admin/moods/:id', protect, adminOnly, updateMood);
router.delete('/admin/moods/:id', protect, adminOnly, deleteMood);
router.post('/admin/moods/reorder', protect, adminOnly, reorderMoods);

export default router;
