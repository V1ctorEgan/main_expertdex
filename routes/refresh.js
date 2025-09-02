const express = require('express');
const router = express.Router();
const refreshTokenController = require('../controllers/refreshTokenController');

router.get('/', refreshTokenController.handleRefreshToken);

console.log("Loading refresh routes...");
module.exports = router;