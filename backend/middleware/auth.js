const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Extract user from JWT token
exports.extractUser = async (req, res, next) => {
    try {
        // Check for token in multiple places
        const token = 
            req.headers['x-auth-token'] || 
            req.cookies?.token ||
            (req.headers.authorization && req.headers.authorization.startsWith('Bearer ') 
                ? req.headers.authorization.split(' ')[1] 
                : null);
        
        if (!token) {
            console.log('No authentication token found');
            return next();
        }
        
        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
            
            // Find user by ID from token
            const user = await User.findById(decoded.user.id).select('-password');
            
            if (!user) {
                console.log('User not found with decoded ID');
                return next();
            }
            
            // Add user to request and response locals
            req.user = user;
            res.locals.user = user;
            
            console.log('User authenticated via middleware:', user.username);
        } catch (tokenError) {
            console.error('Token verification failed:', tokenError.message);
            // Don't return error, continue without authenticated user
        }
        
        next();
    } catch (error) {
        console.error('User extraction error:', error);
        next();
    }
};

// Middleware to check if user is authenticated
exports.authMiddleware = (req, res, next) => {
    if (!req.user) {
        return res.status(401).redirect('/auth/login');
    }
    next();
};

// Middleware to check if user is admin
exports.adminMiddleware = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).render('error', { 
            title: 'Access Denied',
            message: 'You need admin privileges to access this page'
        });
    }
    next();
};