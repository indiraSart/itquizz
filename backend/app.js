const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
// Using node-fetch v2 syntax which works with CommonJS
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require('dotenv').config(); // Add this line to load .env file

// Import routes (will be created later)
const authRoutes = require('./routes/auth');
const quizRoutes = require('./routes/quiz');
const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/admin');
const faqRoutes = require('./routes/faq');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));

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
    res.render('auth/login', { title: 'Login' });
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

// Handle quiz creation form submission
app.post('/quizzes/create', async (req, res) => {
    try {
        // If user is not logged in, redirect to login page
        if (!req.user) {
            // Store intended action in session/cookie if implementing that feature
            return res.redirect('/auth/login');
        }
        
        // Forward the request to the API endpoint
        const response = await fetch(`${req.protocol}://${req.get('host')}/api/quizzes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': req.headers['x-auth-token'] // Pass along auth token if available
            },
            body: JSON.stringify(req.body)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Redirect to the newly created quiz
            res.redirect(`/quizzes/${data._id}`);
        } else {
            // Re-render the create page with error message
            res.render('quizzes/create', {
                title: 'Create Quiz',
                error: data.message || 'Error creating quiz',
                formData: req.body // Return form data so user doesn't lose their input
            });
        }
    } catch (error) {
        res.render('quizzes/create', {
            title: 'Create Quiz',
            error: 'Server error occurred',
            formData: req.body
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
