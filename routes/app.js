const express = require('express');
const router = express.Router();
const appController = require('../controllers/appController');
const postController = require('../controllers/postController');

// Basic route handlers
router.get('/', appController.renderHome);
router.get('/login', appController.renderLogin);
router.get('/register', appController.renderRegister);

// Post routes
router.post('/posts', postController.createPost);
router.get('/posts', postController.getAllPosts);

module.exports = router;