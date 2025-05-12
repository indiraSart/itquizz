const mongoose = require('mongoose');

const QuizSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: ['Web Development', 'Programming', 'Networking', 'Security', 'Database', 'DevOps', 'Other']
    },
    difficulty: {
        type: String,
        required: true,
        enum: ['Easy', 'Medium', 'Hard']
    },
    questions: [{
        question: {
            type: String,
            required: true
        },
        options: [{
            type: String,
            required: true
        }],
        correctAnswer: {
            type: Number,
            required: true
        },
        explanation: {
            type: String
        }
    }],
    timeLimit: {
        type: Number,
        default: 0 // 0 means no time limit
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    attempts: {
        type: Number,
        default: 0
    },
    isPublished: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Quiz', QuizSchema);
