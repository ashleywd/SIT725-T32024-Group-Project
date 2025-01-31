const express = require('express');
const router = express.Router();
const accountController = require('../controllers/accountController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, accountController.getAccountDetails);
router.get('/details/:userId', authMiddleware, accountController.getAccountDetailsByUserId);
router.get('/points', authMiddleware, accountController.getAccountPoints);
router.put('/', authMiddleware, accountController.updateAccountDetails);
router.delete('/', authMiddleware, accountController.deleteAccount);

module.exports = router;
