const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const { authMiddleware } = require('../middleware/auth');

// CRUD Endpoints
router.post('/', authMiddleware, quizController.createQuiz);
router.get('/', quizController.getAllQuizzes);
router.get('/popular', quizController.getPopularQuizzes);
router.get('/recent', quizController.getRecentQuizzes);

// Quiz submission endpoint (before /:id to avoid route conflicts)
router.post('/submit', quizController.submitQuizAttempt);

// Individual quiz routes
router.get('/:id', quizController.getQuizById);
router.put('/:id', authMiddleware, quizController.updateQuiz);
router.delete('/:id', authMiddleware, quizController.deleteQuiz);

module.exports = router;