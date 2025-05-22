const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authMiddleware, authController.getCurrentUser);

// Frontend routes for auth pages
router.get('/login', (req, res) => {
    res.render('auth/login', { title: 'Login' });
});

router.get('/register', (req, res) => {
    res.render('auth/register', { title: 'Register' });
});

// Logout route
router.get('/logout', (req, res) => {
    // Clear the token cookie
    res.clearCookie('token');
    
    // Redirect to home page
    res.redirect('/');
});

module.exports = router;
