import express from 'express';
import { getHomeCms, updateHomeCms } from '../controllers/homeCmsController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getHomeCms);
router.put('/', protect, adminOnly, updateHomeCms);

export default router;
