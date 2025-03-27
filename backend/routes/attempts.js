const express = require('express');
const { submitAttempt, getAttemptById } = require('../controller/attemptController');
const router = express.Router();

router.post('/submit', submitAttempt); 
router.get('/user/:userId', getAttemptById);

module.exports = router;
