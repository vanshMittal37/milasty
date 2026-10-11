import express from 'express';
import {
  reorderProducts,
  getProducts,
  getProductBySlugOrId,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getProducts);
router.get('/:identifier', getProductBySlugOrId);
router.post('/', protect, adminOnly, createProduct);
// Drag-and-drop order (registered before /:id so "admin" isn't taken as a product id)
router.put('/admin/reorder', protect, adminOnly, reorderProducts);
router.put('/:id', protect, adminOnly, updateProduct);
router.delete('/:id', protect, adminOnly, deleteProduct);

export default router;
