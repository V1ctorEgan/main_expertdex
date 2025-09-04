const express = require('express');
const router = express.Router();
const bookingController = require('../../controllers/bookingController');
const verifyJWT = require('../../middleware/verifyJWT');
const verifyRoles = require('../../middleware/verifyRoles');
const ROLES_LIST = require('../../config/roles_list');


module.exports = (io) => {
    // All routes below this line will have access to `io`.

    router.route('/')
        // Correct: All authenticated GET requests need verifyJWT first
        .get(verifyJWT, verifyRoles([ROLES_LIST.Admin, ROLES_LIST.Company, ROLES_LIST.Individual, ROLES_LIST.Driver]), bookingController.getAllBookings)
        // Correct: All authenticated POST requests need verifyJWT first
        .post(verifyJWT, verifyRoles([ROLES_LIST.Individual]), (req, res, next) => bookingController.createNewBooking(req, res, next, io));

    router.route('/:id')
        // Correct: All authenticated GET requests need verifyJWT first
        .get(verifyJWT, verifyRoles([ROLES_LIST.Admin, ROLES_LIST.Company, ROLES_LIST.Individual, ROLES_LIST.Driver]), bookingController.getBooking)
        // Correct: All authenticated PUT requests need verifyJWT first
        .put(verifyJWT, verifyRoles([ROLES_LIST.Admin, ROLES_LIST.Company, ROLES_LIST.Driver]), (req, res, next) => bookingController.updateBookingStatus(req, res, next, io));

    router.route('/cancel/:id')
        // Correct: All authenticated PUT requests need verifyJWT first
        .put(verifyJWT, verifyRoles([ROLES_LIST.Admin, ROLES_LIST.Individual]), bookingController.cancelBooking);

    router.route('/assign-driver/:id')
        // Correct: All authenticated PUT requests need verifyJWT first
        .put(verifyJWT, verifyRoles([ROLES_LIST.Admin, ROLES_LIST.Company]), bookingController.assignDriverToBooking);

    return router;
};