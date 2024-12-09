// Dependancies
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');
const { connectDB } = require('./config/db');

// Initialize express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Session setup
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));

// Connect to MongoDB
connectDB();

// Optional: Create test data in development environment
if (process.env.NODE_ENV === 'development') {
    const { createTestData } = require('./test/seed');
    // createTestData();  // Uncomment when needed
}

// Basic routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/posts', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'posts.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});