import express from 'express';
import {
  getPublicSnackFinder,
  getAdminSnackFinder,
  createOption,
  updateOption,
  deleteOption,
} from '../controllers/snackFinderController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getPublicSnackFinder);
router.get('/admin/all', protect, admin, getAdminSnackFinder);
router.post('/options', protect, admin, createOption);
router.put('/options/:id', protect, admin, updateOption);
router.delete('/options/:id', protect, admin, deleteOption);

export default router;
