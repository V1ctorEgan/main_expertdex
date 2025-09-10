const express = require('express');
const router = express.Router();
const paymentController = require('../../controllers/paymentController');
const verifyJWT = require('../../middleware/verifyJWT');
const verifyRoles = require('../../middleware/verifyRoles');
const {ROLES_LIST} = require('../../config/roles_list');


router.route('/initiate')
    .post(verifyJWT, verifyRoles([ROLES_LIST.Individual]), paymentController.initiatePayment);


router.route('/success')
    .post(paymentController.handlePaymentSuccess);

module.exports = router;