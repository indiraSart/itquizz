const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Get user profile
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user profile', error: error.message });
    }
};

// Update user profile
exports.updateProfile = async (req, res) => {
    try {
        const { password, ...updates } = req.body;
        const user = await User.findByIdAndUpdate(
            req.user._id,
            updates,
            { new: true }
        ).select('-password');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error updating user profile', error: error.message });
    }
};

// Change password
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        // Find user
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Validate current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }
        
        // Hash new password and update
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();
        
        res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error changing password', error: error.message });
    }
};

// Get user's quiz history
exports.getQuizHistory = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('quizAttempts');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.status(200).json(user.quizAttempts || []);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching quiz history', error: error.message });
    }
};

// Admin: Get all users
exports.getAllUsers = async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Permission denied' });
        }
        
        const users = await User.find().select('-password');
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users', error: error.message });
    }
};

// Admin: Get user by ID
exports.getUserById = async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Permission denied' });
        }
        
        const user = await User.findById(req.params.id).select('-password');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user', error: error.message });
    }
};

// Admin: Update user
exports.updateUser = async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Permission denied' });
        }
        
        const { password, ...updates } = req.body;
        const user = await User.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true }
        ).select('-password');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error updating user', error: error.message });
    }
};

// Admin: Delete user
exports.deleteUser = async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Permission denied' });
        }
        
        const user = await User.findByIdAndDelete(req.params.id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting user', error: error.message });
    }
};