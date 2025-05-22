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
        default: 'Other'
    },
    difficulty: {
        type: String,
        default: 'Medium'
    },
    questions: [{
        question: {
            type: String,
            required: true
        },
        questionType: {
            type: String,
            default: 'multipleChoice'
        },
        options: [String],
        correctAnswer: {
            type: mongoose.Schema.Types.Mixed,
            required: true
        },
        explanation: String,
        points: {
            type: Number,
            default: 1
        }
    }],
    timeLimit: {
        type: Number,
        default: 0
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
