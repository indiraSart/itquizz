const Quiz = require('../models/Quiz');

// Create a new quiz
exports.createQuiz = async (req, res) => {
    try {
        console.log('Creating quiz with request body:', JSON.stringify(req.body, null, 2));
        console.log('User logged in:', req.user ? `${req.user.username} (${req.user._id})` : 'No user');
        
        // Check authentication
        if (!req.user || !req.user._id) {
            return res.status(401).json({ message: 'Du må være logget inn for å lage en quiz' });
        }
        
        // Basic validation
        if (!req.body.title) {
            return res.status(400).json({ message: 'Quizzen må ha en tittel' });
        }
        
        if (!req.body.description) {
            return res.status(400).json({ message: 'Quizzen må ha en beskrivelse' });
        }
        
        if (!req.body.questions || !Array.isArray(req.body.questions) || req.body.questions.length === 0) {
            return res.status(400).json({ message: 'Quizzen må ha minst ett spørsmål' });
        }
        
        // Create a normalized quiz object
        const quizData = {
            title: req.body.title,
            description: req.body.description,
            category: req.body.category || 'Other',
            createdBy: req.user._id,
            isPublished: req.body.isPublished !== false,
            questions: req.body.questions.map(q => ({
                question: q.questionText || q.question,
                questionType: q.questionType || 'multipleChoice',
                options: Array.isArray(q.options) ? q.options : [],
                correctAnswer: q.correctAnswer || '',
                points: parseInt(q.points) || 1
            }))
        };
        
        console.log('Creating quiz with normalized data');
        
        // Create and save the quiz
        const Quiz = require('../models/Quiz');
        const quiz = new Quiz(quizData);
        
        const savedQuiz = await quiz.save();
        console.log('Quiz saved successfully with ID:', savedQuiz._id);
        
        res.status(201).json({
            message: 'Quiz opprettet!',
            _id: savedQuiz._id,
            title: savedQuiz.title
        });
    } catch (error) {
        console.error('Error creating quiz:', error);
        
        // Return appropriate error based on the type
        if (error.name === 'ValidationError') {
            // Handle Mongoose validation errors
            const messages = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({ 
                message: 'Valideringsfeil', 
                details: messages.join(', ')
            });
        }
        
        res.status(500).json({ 
            message: 'Det oppstod en feil ved oppretting av quizzen', 
            error: error.message 
        });
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
        console.log('Submitting quiz attempt:', { quizId, answers });
        
        const quiz = await Quiz.findById(quizId);
        
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }
        
        // Calculate score
        let score = 0;
        let totalPoints = 0;
        const results = [];
        
        answers.forEach((answer, index) => {
            if (index >= quiz.questions.length) return;
            
            const question = quiz.questions[index];
            totalPoints += question.points || 1;
            
            let isCorrect = false;
            
            // Handle different question types
            if (question.questionType === 'multipleChoice') {
                isCorrect = parseInt(answer) === parseInt(question.correctAnswer);
            } else if (question.questionType === 'trueFalse') {
                isCorrect = answer.toString().toLowerCase() === question.correctAnswer.toString().toLowerCase();
            } else {
                // Short answer - could implement more flexible matching
                isCorrect = answer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();
            }
            
            if (isCorrect) {
                score += question.points || 1;
            }
            
            results.push({
                question: question,
                userAnswer: answer,
                correct: isCorrect
            });
        });
        
        // Update quiz attempt count
        quiz.attempts = (quiz.attempts || 0) + 1;
        await quiz.save();
        
        // If user is logged in, save their attempt
        if (req.user) {
            // Code to save user attempt history if needed
        }
        
        res.status(200).json({
            score,
            totalPoints,
            results,
            quiz
        });
    } catch (error) {
        console.error('Error submitting quiz attempt:', error);
        res.status(500).json({ message: 'Error submitting quiz attempt', error: error.message });
    }
};