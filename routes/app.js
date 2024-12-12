const express = require('express');
const router = express.Router();
const controller = require('../controllers/appController');
 const verifyToken = require('../middleware/authMiddleware');

// Basic route handlers
router.get('/', controller.renderHome);
router.get('/posts', verifyToken, controller.renderPosts);
router.get('/login', controller.renderLogin);
router.get('/register', controller.renderRegister);

module.exports = router;