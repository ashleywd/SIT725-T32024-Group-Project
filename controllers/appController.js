const path = require('path');

const controller = {
    renderHome: (req, res) => {
        res.sendFile(path.join(__dirname, '../public', 'index.html'));
    },

    renderPosts: (req, res) => {
        res.sendFile(path.join(__dirname, '../public', 'posts.html'));
    },

    renderLogin: (req, res) => {
        res.sendFile(path.join(__dirname, '../public', 'login.html'));
    },

    renderRegister: (req, res) => {
        res.sendFile(path.join(__dirname, '../public', 'register.html'));
    },

    handleError: (err, req, res, next) => {
        console.error(err.stack);
        res.status(500).json({ error: 'Something went wrong!' });
    },

    handle404: (req, res) => {
        res.status(404).json({ error: 'Route not found' });
    }
};

module.exports = controller;