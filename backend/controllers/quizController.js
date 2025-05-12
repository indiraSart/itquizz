const Quiz = require('../models/Quiz');

// Create a new quiz
exports.createQuiz = async (req, res) => {
    try {
        const quiz = new Quiz({
            ...req.body,
            createdBy: req.user._id // Assuming authentication middleware adds user to req
        });
        await quiz.save();
        res.status(201).json(quiz);
    } catch (error) {
        res.status(500).json({ message: 'Error creating quiz', error: error.message });
    }
};

// Get all quizzes
exports.getAllQuizzes = async (req, res) => {
    try {
        const quizzes = await Quiz.find().populate('createdBy', 'username');
        res.status(200).json(quizzes);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching quizzes', error: error.message });
    }
};

// Get popular quizzes
exports.getPopularQuizzes = async (req, res) => {
    try {
        const quizzes = await Quiz.find().sort({ attempts: -1 }).limit(5).populate('createdBy', 'username');
        res.status(200).json(quizzes);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching popular quizzes', error: error.message });
    }
};

// Get recent quizzes
exports.getRecentQuizzes = async (req, res) => {
    try {
        const quizzes = await Quiz.find().sort({ createdAt: -1 }).limit(5).populate('createdBy', 'username');
        res.status(200).json(quizzes);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching recent quizzes', error: error.message });
    }
};

// Get a single quiz by ID
exports.getQuizById = async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id).populate('createdBy', 'username');
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }
        res.status(200).json(quiz);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching quiz', error: error.message });
    }
};

// Update a quiz by ID
exports.updateQuiz = async (req, res) => {
    try {
        const quiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }
        res.status(200).json(quiz);
    } catch (error) {
        res.status(500).json({ message: 'Error updating quiz', error: error.message });
    }
};

// Delete a quiz by ID
exports.deleteQuiz = async (req, res) => {
    try {
        const quiz = await Quiz.findByIdAndDelete(req.params.id);
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }
        res.status(200).json({ message: 'Quiz deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting quiz', error: error.message });
    }
};

// Submit quiz attempt
exports.submitQuizAttempt = async (req, res) => {
    try {
        const { quizId, answers } = req.body;
        const quiz = await Quiz.findById(quizId);
        
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }
        
        // Calculate score
        let score = 0;
        const results = [];
        
        answers.forEach((answer, index) => {
            const question = quiz.questions[index];
            const isCorrect = question.correctAnswer === answer;
            
            if (isCorrect) {
                score++;
            }
            
            results.push({
                questionId: question._id,
                userAnswer: answer,
                correctAnswer: question.correctAnswer,
                isCorrect
            });
        });
        
        // Update quiz attempt count
        quiz.attempts = (quiz.attempts || 0) + 1;
        await quiz.save();
        
        res.status(200).json({
            score,
            totalQuestions: quiz.questions.length,
            results
        });
    } catch (error) {
        res.status(500).json({ message: 'Error submitting quiz attempt', error: error.message });
    }
};