import express from 'express';
import {
  getPublicSnackFinder,
  getAdminSnackFinder,
  createOption,
  updateOption,
  deleteOption,
} from '../controllers/snackFinderController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getPublicSnackFinder);
router.get('/admin/all', protect, adminOnly, getAdminSnackFinder);
router.post('/options', protect, adminOnly, createOption);
router.put('/options/:id', protect, adminOnly, updateOption);
router.delete('/options/:id', protect, adminOnly, deleteOption);

export default router;
