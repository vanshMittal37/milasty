import express from 'express';
import {
  getPublicIngredients,
  getAdminIngredients,
  createIngredient,
  updateIngredient,
  deleteIngredient,
} from '../controllers/ingredientController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getPublicIngredients);
router.get('/admin/all', protect, adminOnly, getAdminIngredients);
router.post('/', protect, adminOnly, createIngredient);
router.put('/:id', protect, adminOnly, updateIngredient);
router.delete('/:id', protect, adminOnly, deleteIngredient);

export default router;
