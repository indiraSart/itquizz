const app = require('./app');
const http = require('http');
const { authMiddleware, adminMiddleware } = require('./middleware/auth');

// Regular server setup
const PORT = process.env.PORT || 4000;
const server = http.createServer(app);

// Add admin routes to the main app
app.get('/admin', authMiddleware, adminMiddleware, (req, res) => {
    res.render('admin/dashboard', { 
        title: 'Admin Dashboard',
        user: req.user
    });
});

// Admin user management routes
app.get('/admin/users', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const User = require('./models/User');
        const users = await User.find().select('-password');
        res.render('admin/users', { 
            title: 'User Management', 
            users,
            user: req.user
        });
    } catch (error) {
        res.status(500).render('error', { 
            title: 'Error', 
            message: 'Failed to load users',
            user: req.user
        });
    }
});

// Admin quiz management routes
app.get('/admin/quizzes', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const Quiz = require('./models/Quiz');
        const quizzes = await Quiz.find().populate('createdBy', 'username');
        res.render('admin/quizzes', { 
            title: 'Quiz Management', 
            quizzes,
            user: req.user
        });
    } catch (error) {
        res.status(500).render('error', { 
            title: 'Error', 
            message: 'Failed to load quizzes',
            user: req.user
        });
    }
});

// Admin user activity routes
app.get('/admin/activities', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const Activity = require('./models/Activity');
        const activities = await Activity.find()
            .populate('user', 'username')
            .sort({ timestamp: -1 })
            .limit(100);
            
        res.render('admin/activities', { 
            title: 'User Activities', 
            activities,
            user: req.user
        });
    } catch (error) {
        res.status(500).render('error', { 
            title: 'Error', 
            message: 'Failed to load activities',
            user: req.user
        });
    }
});

// Start server
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT} in your browser`);
    console.log(`To create a quiz, go to http://localhost:${PORT}/quizzes/create`);
    console.log(`Admin dashboard available at http://localhost:${PORT}/admin (requires admin login)`);
});
