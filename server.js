require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');

// Initialize express app
const app = express();

// Check required environment variables
if (!process.env.SESSION_SECRET) {
    console.error('SESSION_SECRET is required');
    process.exit(1);
}

if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is required');
    process.exit(1);
}

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Session setup
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Basic route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: '500 Server Error' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: '404 Not Found' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});