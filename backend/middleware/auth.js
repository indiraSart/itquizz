const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.authMiddleware = async (req, res, next) => {
    try {
        // Check for token
        const token = req.header('x-auth-token');
        if (!token) {
            return res.status(401).json({ message: 'No token, authorization denied' });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
        
        // Find user by id
        const user = await User.findById(decoded.id).select('-password');
        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }
        
        // Attach user to request
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

exports.adminMiddleware = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
};