const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/', authController.handleLogin);
console.log("Loading auth routes...");
module.exports = router;