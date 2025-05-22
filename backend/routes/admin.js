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

// API endpoints for admin dashboard
router.get('/api/admin/stats', async (req, res) => {
    try {
        const User = require('../models/User');
        const Quiz = require('../models/Quiz');
        const Activity = require('../models/Activity');
        
        // Get counts
        const totalUsers = await User.countDocuments();
        const totalQuizzes = await Quiz.countDocuments({ isPublished: true });
        
        // Calculate total quiz attempts
        const quizzes = await Quiz.find({ isPublished: true });
        const quizAttempts = quizzes.reduce((total, quiz) => total + (quiz.attempts || 0), 0);
        
        // Count recent activities (last 24 hours)
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        const recentActivities = await Activity.countDocuments({ 
            timestamp: { $gte: oneDayAgo } 
        });
        
        res.json({
            totalUsers,
            totalQuizzes,
            quizAttempts,
            recentActivities
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching admin stats', error: error.message });
    }
});

// Recent activities endpoint
router.get('/api/admin/activities/recent', async (req, res) => {
    try {
        const Activity = require('../models/Activity');
        
        const activities = await Activity.find()
            .populate('user', 'username')
            .sort({ timestamp: -1 })
            .limit(10);
            
        res.json(activities);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching recent activities', error: error.message });
    }
});

// Recent quizzes endpoint
router.get('/api/admin/quizzes/recent', async (req, res) => {
    try {
        const Quiz = require('../models/Quiz');
        
        const quizzes = await Quiz.find()
            .populate('createdBy', 'username')
            .sort({ createdAt: -1 })
            .limit(5);
            
        res.json(quizzes);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching recent quizzes', error: error.message });
    }
});

// Recent users endpoint
router.get('/api/admin/users/recent', async (req, res) => {
    try {
        const User = require('../models/User');
        
        const users = await User.find()
            .select('-password')
            .sort({ createdAt: -1 })
            .limit(5);
            
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching recent users', error: error.message });
    }
});

module.exports = router;