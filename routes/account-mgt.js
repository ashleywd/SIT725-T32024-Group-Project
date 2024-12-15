const express = require('express');
const { updateAccountDetails } = require('../controllers/accountController');
const { deleteAccount } = require('../controllers/accountController');
const router = express.Router();

router.put('/account', updateAccountDetails);
router.delete('/account', deleteAccount);

module.exports = router;
