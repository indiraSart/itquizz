const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Create admin user
exports.createAdmin = async (req, res) => {
    try {
        // Check if requester is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Permission denied' });
        }
        
        const { username, email, password } = req.body;
        
        // Check if user exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }
        
        // Create new admin user
        user = new User({
            username,
            email,
            password,
            role: 'admin'
        });
        
        await user.save();
        
        res.status(201).json({
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error creating admin', error: error.message });
    }
};

// Get all admin users
exports.getAllAdmins = async (req, res) => {
    try {
        // Check if requester is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Permission denied' });
        }
        
        const admins = await User.find({ role: 'admin' }).select('-password');
        res.status(200).json(admins);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching admins', error: error.message });
    }
};

// Get admin by ID
exports.getAdminById = async (req, res) => {
    try {
        // Check if requester is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Permission denied' });
        }
        
        const admin = await User.findOne({ _id: req.params.id, role: 'admin' }).select('-password');
        
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }
        
        res.status(200).json(admin);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching admin', error: error.message });
    }
};

// Update admin
exports.updateAdmin = async (req, res) => {
    try {
        // Check if requester is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Permission denied' });
        }
        
        const { password, ...updates } = req.body;
        const admin = await User.findOneAndUpdate(
            { _id: req.params.id, role: 'admin' },
            updates,
            { new: true }
        ).select('-password');
        
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }
        
        res.status(200).json(admin);
    } catch (error) {
        res.status(500).json({ message: 'Error updating admin', error: error.message });
    }
};

// Delete admin
exports.deleteAdmin = async (req, res) => {
    try {
        // Check if requester is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Permission denied' });
        }
        
        const admin = await User.findOneAndDelete({ _id: req.params.id, role: 'admin' });
        
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }
        
        res.status(200).json({ message: 'Admin deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting admin', error: error.message });
    }
};