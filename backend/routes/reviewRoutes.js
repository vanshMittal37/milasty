import express from 'express';
import { getReviews, getFaqs } from '../controllers/reviewController.js';

const router = express.Router();

router.get('/reviews', getReviews);
router.get('/faqs', getFaqs);

export default router;
