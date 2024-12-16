const express = require('express');
const router = express.Router();
const accountController =  require('../controllers/accountController');

router.get('/', accountController.getAccountDetails)       // GET /account
router.get('/points', accountController.getAccountPoints)  // GET /account/points
router.put('/', accountController.updateAccountDetails)    // PUT /account
router.delete('/', accountController.deleteAccount);       // DELETE /account

module.exports = router;
