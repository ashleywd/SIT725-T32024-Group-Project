const express = require('express');
const { updateAccountDetails } = require('../controllers/accountController');
const router = express.Router();

router.put('/account', updateAccountDetails);

module.exports = router;
