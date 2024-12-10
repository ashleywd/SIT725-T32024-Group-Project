require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const routes = require('./routes/app');
const controller = require('./controllers/appController');
const { connectDB } = require('./config/db');

// Set our server port
const port = process.env.PORT || 3000

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Use the router
app.use('/', routes);

// Error handlers
app.use(controller.handleError);
app.use(controller.handle404);

// Start the server
app.listen(port, () => {
    console.log(`App listening to: ${port}`);
});