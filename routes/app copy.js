const express = require('express');
const router = express.Router();
const controller = require('../controllers/appController');
const postController = require('../controllers/postController');

// Basic route handlers
router.get('/', controller.renderHome);
router.get('/posts', controller.renderPosts);
router.get('/login', controller.renderLogin);
router.get('/register', controller.renderRegister);

// Post routes
router.post('/posts', postController.createPost);
router.get('/posts', postController.getAllPosts);

module.exports = router;