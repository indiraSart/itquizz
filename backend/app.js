const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const cookieParser = require('cookie-parser');
// Using node-fetch v2 syntax which works with CommonJS
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require('dotenv').config(); // Add this line to load .env file

// Import routes (will be created later)
const authRoutes = require('./routes/auth');
const quizRoutes = require('./routes/quiz');
const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/admin');
const faqRoutes = require('./routes/faq');

// Import middleware
const { extractUser, authMiddleware } = require('./middleware/auth');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Apply the user extraction middleware to all routes
app.use(extractUser);

// Set up EJS view engine with layouts
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../frontend/views'));
app.set('layout', 'layout'); // Default layout file
app.use(express.static(path.join(__dirname, '../frontend/public')));

// Database Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/it-quiz-db', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log('MongoDB connection error:', err));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/faq', faqRoutes);

// User profile routes
app.get('/profile', authMiddleware, async (req, res) => {
    try {
        // Fetch user quiz history and stats
        const Quiz = require('./models/Quiz');
        const userQuizzes = await Quiz.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
        
        res.render('profile/dashboard', {
            title: 'My Profile',
            user: req.user,
            userQuizzes
        });
    } catch (error) {
        console.error('Error fetching profile data:', error);
        res.render('error', {
            title: 'Error',
            message: 'Failed to load profile data'
        });
    }
});

app.get('/my-quizzes', authMiddleware, async (req, res) => {
    try {
        const Quiz = require('./models/Quiz');
        const userQuizzes = await Quiz.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
        
        res.render('profile/my-quizzes', {
            title: 'My Quizzes',
            quizzes: userQuizzes
        });
    } catch (error) {
        res.render('error', {
            title: 'Error',
            message: 'Failed to load your quizzes'
        });
    }
});

// Frontend Routes
app.get('/', async (req, res) => {
    try {
        // Import Quiz and User models
        const Quiz = require('./models/Quiz');
        const User = require('./models/User');
        
        console.log('Fetching dashboard statistics...');
        
        // Get actual counts from database with logging
        const totalQuizzes = await Quiz.countDocuments({ isPublished: true });
        console.log(`Found ${totalQuizzes} published quizzes`);
        
        const users = await User.countDocuments();
        console.log(`Found ${users} users`);
        
        // Calculate total questions across all quizzes
        const quizzes = await Quiz.find({ isPublished: true });
        console.log(`Retrieved ${quizzes.length} quizzes for detailed stats`);
        
        const totalQuestions = quizzes.reduce((total, quiz) => total + (quiz.questions && Array.isArray(quiz.questions) ? quiz.questions.length : 0), 0);
        console.log(`Calculated ${totalQuestions} total questions`);
        
        // Calculate total quiz attempts
        const quizAttempts = quizzes.reduce((total, quiz) => total + (quiz.attempts || 0), 0);
        console.log(`Calculated ${quizAttempts} total attempts`);
        
        // Get popular quizzes (sorted by number of attempts)
        const popularQuizzes = await Quiz.find({ isPublished: true })
            .sort({ attempts: -1 })
            .limit(5)
            .populate('createdBy', 'username');
        
        // Get recent quizzes
        const recentQuizzes = await Quiz.find({ isPublished: true })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('createdBy', 'username');
            
        // Map quizzes to format expected by template
        const formattedPopularQuizzes = popularQuizzes.map(quiz => ({
            _id: quiz._id,
            title: quiz.title,
            category: quiz.category,
            attempts: quiz.attempts,
            creator: { username: quiz.createdBy ? quiz.createdBy.username : 'Anonym' }
        }));
        
        const formattedRecentQuizzes = recentQuizzes.map(quiz => ({
            _id: quiz._id,
            title: quiz.title,
            category: quiz.category,
            createdAt: quiz.createdAt,
            questions: quiz.questions,
            creator: { username: quiz.createdBy ? quiz.createdBy.username : 'Anonym' }
        }));
        
        // Log what we're sending to the template
        console.log('Rendering index template with stats:', {
            totalQuizzes,
            totalQuestions,
            totalUsers: users,
            quizAttempts
        });
        
        res.render('index', {
            title: 'Home',
            totalQuizzes,
            totalQuestions,
            totalUsers: users,
            quizAttempts,
            popularQuizzes: formattedPopularQuizzes,
            recentQuizzes: formattedRecentQuizzes
        });
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.render('index', {
            title: 'Home',
            error: 'Could not load dashboard data',
            totalQuizzes: 0,
            totalQuestions: 0,
            totalUsers: 0,
            quizAttempts: 0,
            popularQuizzes: [],
            recentQuizzes: []
        });
    }
});

// Authentication routes (frontend)
app.get('/auth/login', (req, res) => {
    const redirect = req.query.redirect || '/';
    res.render('auth/login', { 
        title: 'Login',
        redirect
    });
});

app.get('/auth/register', (req, res) => {
    res.render('auth/register', { title: 'Register' });
});

app.get('/auth/logout', (req, res) => {
    // Clear any session data if applicable
    res.redirect('/');
});

// Add routes for Browse Quizzes and Create Quiz pages
app.get('/quizzes/browse', (req, res) => {
    res.render('quizzes/browse', { 
        title: 'Browse Quizzes',
        quizzes: [] 
    });
});

app.get('/quizzes/create', (req, res) => {
    res.render('quizzes/create', {
        title: 'Create Quiz'
    });
});

// Handle quiz creation form submission - simplified version that redirects to API
app.post('/quizzes/create', (req, res) => {
    // If user is not authenticated, redirect to login
    if (!req.user) {
        return res.redirect('/auth/login?redirect=/quizzes/create');
    }
    
    // Forward to API endpoint (client-side JavaScript should handle this, but this is a fallback)
    res.redirect('/api/quizzes');
});

// Enhanced quiz creation handler - as a fallback for the API route
app.post('/quizzes/create', async (req, res) => {
    try {
        console.log('Direct quiz creation route accessed');
        console.log('Auth status:', req.user ? 'Authenticated' : 'Not authenticated');
        
        // Redirect if not logged in
        if (!req.user) {
            return res.redirect('/auth/login?redirect=/quizzes/create');
        }
        
        // Basic validation
        if (!req.body.title || !req.body.description) {
            return res.render('quizzes/create', {
                title: 'Create Quiz',
                error: 'Title and description are required'
            });
        }
        
        // Create a basic quiz object
        const quizData = {
            title: req.body.title,
            description: req.body.description,
            category: req.body.category || 'Other',
            createdBy: req.user._id,
            questions: []
        };
        
        // Process questions if they exist
        if (req.body.questions) {
            // Handle string format (from regular form submission)
            let questions = req.body.questions;
            if (typeof questions === 'string') {
                try {
                    questions = JSON.parse(questions);
                } catch (e) {
                    console.error('Failed to parse questions JSON:', e);
                }
            }
            
            // If questions is an array, process it
            if (Array.isArray(questions)) {
                questions.forEach(q => {
                    const questionText = q.questionText || q.question || '';
                    if (!questionText) return;
                    
                    quizData.questions.push({
                        question: questionText,
                        questionType: q.questionType || 'multipleChoice',
                        options: Array.isArray(q.options) ? q.options : [],
                        correctAnswer: q.correctAnswer || '',
                        points: parseInt(q.points) || 1
                    });
                });
            }
        }
        
        // Make sure we have at least one question
        if (quizData.questions.length === 0) {
            return res.render('quizzes/create', {
                title: 'Create Quiz',
                error: 'At least one question is required'
            });
        }
        
        // Create and save the quiz
        const Quiz = require('./models/Quiz');
        const quiz = new Quiz(quizData);
        await quiz.save();
        
        // Redirect to the new quiz
        res.redirect(`/quizzes/${quiz._id}`);
    } catch (error) {
        console.error('Error in direct quiz creation route:', error);
        res.render('quizzes/create', {
            title: 'Create Quiz',
            error: 'An error occurred: ' + error.message
        });
    }
});

// Route to view a specific quiz
app.get('/quizzes/:id', async (req, res) => {
    try {
        // Fetch quiz from API
        const response = await fetch(`${req.protocol}://${req.get('host')}/api/quizzes/${req.params.id}`);
        
        if (!response.ok) {
            return res.status(404).render('error', { 
                title: 'Not Found',
                message: 'Quiz not found' 
            });
        }
        
        const quiz = await response.json();
        
        res.render('quizzes/take', { 
            title: quiz.title,
            quiz: quiz
        });
    } catch (error) {
        res.status(500).render('error', { 
            title: 'Error',
            message: 'Error loading quiz' 
        });
    }
});

// Route for quiz results
app.get('/quizzes/:id/results', async (req, res) => {
    try {
        // Fetch quiz from API
        const response = await fetch(`${req.protocol}://${req.get('host')}/api/quizzes/${req.params.id}`);
        
        if (!response.ok) {
            return res.status(404).render('error', { 
                title: 'Not Found',
                message: 'Quiz not found' 
            });
        }
        
        const quiz = await response.json();
        
        res.render('quizzes/results', { 
            title: 'Quiz Results',
            quiz: quiz,
            // The actual score will be passed from the client-side via JavaScript
        });
    } catch (error) {
        res.status(500).render('error', { 
            title: 'Error',
            message: 'Error loading quiz results' 
        });
    }
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../frontend/build')));
    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, '../frontend/build', 'index.html'));
    });
}

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Server error', error: err.message });
});

module.exports = app;
