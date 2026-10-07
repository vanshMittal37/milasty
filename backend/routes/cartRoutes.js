import express from 'express';
import { getCart, updateCart, clearCart, cartDiagnostic } from '../controllers/cartController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public diagnostic route - call to check if cart column works
// GET /api/cart/diagnostic?userId=XXX
router.get('/diagnostic', cartDiagnostic);

router.get('/', protect, getCart);
router.put('/', protect, updateCart);
router.delete('/', protect, clearCart);

export default router;
