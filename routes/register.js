const express = require('express');
const router = express.Router();
const registerController = require('../controllers/registerController');

router.post('/', registerController.handleNewUser);
console.log("Loading register route")
module.exports = router;