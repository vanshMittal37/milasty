import express from 'express';
import {
  getPublicQuiz,
  getAllAdminQuiz,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  createOption,
  updateOption,
  deleteOption,
} from '../controllers/quizController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// PUBLIC QUIZ DATA
router.get('/active', getPublicQuiz);
router.get('/', getPublicQuiz);

// ADMIN QUIZ MANAGEMENT
router.get('/admin/all', protect, adminOnly, getAllAdminQuiz);

// Questions CRUD
router.post('/questions', protect, adminOnly, createQuestion);
router.put('/questions/:id', protect, adminOnly, updateQuestion);
router.delete('/questions/:id', protect, adminOnly, deleteQuestion);

// Options CRUD
router.post('/options', protect, adminOnly, createOption);
router.put('/options/:id', protect, adminOnly, updateOption);
router.delete('/options/:id', protect, adminOnly, deleteOption);

export default router;
