require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const routes = require('./routes/app');
const appController = require('./controllers/appController');
const { connectDB } = require('./config/db');

// Set our server port
const port = process.env.PORT || 3000

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// server.js - Add this before your routes
app.use((req, res, next) => {
    console.log('Incoming request:', {
        method: req.method,
        path: req.path,
        body: req.body
    });
    next();
});

// This means all routes will be prefixed with /api
app.use('/api', routes);

// Error handlers
app.use(appController.handleError);
app.use(appController.handle404);

// Start the server
app.listen(port, () => {
    console.log(`App listening to: ${port}`);
});