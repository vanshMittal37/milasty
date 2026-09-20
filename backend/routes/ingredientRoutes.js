import express from 'express';
import {
  getPublicIngredients,
  getAdminIngredients,
  createIngredient,
  updateIngredient,
  deleteIngredient,
} from '../controllers/ingredientController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getPublicIngredients);
router.get('/admin/all', protect, admin, getAdminIngredients);
router.post('/', protect, admin, createIngredient);
router.put('/:id', protect, admin, updateIngredient);
router.delete('/:id', protect, admin, deleteIngredient);

export default router;
