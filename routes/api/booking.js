const express = require('express');
const router = express.Router();
const bookingController = require('../../controllers/bookingController');
const verifyJWT = require('../../middleware/verifyJWT');
const verifyRoles = require('../../middleware/verifyRoles');
const ROLES_LIST = require('../../config/roles_list');


    
router.route('/')
    .get(verifyJWT, verifyRoles([ROLES_LIST.Admin, ROLES_LIST.Company, ROLES_LIST.Individual, ROLES_LIST.Driver]), bookingController.getAllBookings)
    .post(verifyJWT, verifyRoles([ROLES_LIST.Customer]), bookingController.createNewBooking);

router.route('/:id')
    .get(verifyJWT, verifyRoles([ROLES_LIST.Admin, ROLES_LIST.Company, ROLES_LIST.Individual, ROLES_LIST.Driver]), bookingController.getBooking)
    .put(verifyJWT, verifyRoles([ROLES_LIST.Admin, ROLES_LIST.Company, ROLES_LIST.Driver]), bookingController.updateBookingStatus); // Used for status update

router.route('/cancel/:id')
    .put(verifyJWT, verifyRoles([ROLES_LIST.Admin, ROLES_LIST.Customer]), bookingController.cancelBooking);

router.route('/assign-driver/:id')
    .put(verifyJWT, verifyRoles([ROLES_LIST.Admin, ROLES_LIST.Company]), bookingController.assignDriverToBooking);


module.exports = router;