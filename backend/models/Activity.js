const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Allow anonymous activities
    },
    action: {
        type: String,
        required: true,
        enum: ['login', 'register', 'quiz_created', 'quiz_attempted', 'quiz_completed', 'password_changed', 'profile_updated']
    },
    details: {
        type: String,
        required: false
    },
    ip: {
        type: String,
        required: false
    },
    userAgent: {
        type: String,
        required: false
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Activity', ActivitySchema);
