const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const adminController = require('../controllers/adminController');
const userController = require('../controllers/userController');
const quizController = require('../controllers/quizController');

// Middleware to check admin rights
router.use(authMiddleware, adminMiddleware);

// Admin dashboard
router.get('/', (req, res) => {
    res.render('admin/dashboard', { title: 'Admin Dashboard' });
});

// CRUD Endpoints
router.post('/', adminController.createAdmin);
router.get('/admins', adminController.getAllAdmins);
router.get('/admins/:id', adminController.getAdminById);
router.put('/admins/:id', adminController.updateAdmin);
router.delete('/admins/:id', adminController.deleteAdmin);

// User management routes
router.get('/users', userController.getAllUsers);
router.get('/users/:id', userController.getUserById);
router.put('/users/:id', userController.updateUser);
router.delete('/users/:id', userController.deleteUser);

// Quiz management routes
router.get('/quizzes', quizController.getAllQuizzes);
router.get('/quizzes/:id', quizController.getQuizById);
router.put('/quizzes/:id', quizController.updateQuiz);
router.delete('/quizzes/:id', quizController.deleteQuiz);

module.exports = router;