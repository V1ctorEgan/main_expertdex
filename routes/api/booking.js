const express = require('express');
const router = express.Router();
const bookingController = require('../../controllers/bookingController');
const verifyJWT = require('../../middleware/verifyJWT');
const verifyRoles = require('../../middleware/verifyRoles');
const {ROLES_LIST} = require('../../config/roles_list');


module.exports = (io) => {

    router.route('/')
        .get(verifyRoles([ROLES_LIST.Admin, ROLES_LIST.Company, ROLES_LIST.Individual, ROLES_LIST.Driver]), bookingController.getAllBookings)
        .post(verifyRoles([ROLES_LIST.Individual]), (req, res, next) => bookingController.createNewBooking(req, res, next, io));

    router.route('/:id')
        .get(verifyRoles([ROLES_LIST.Admin, ROLES_LIST.Company, ROLES_LIST.Individual, ROLES_LIST.Driver]), bookingController.getBooking)
        .put(verifyRoles([ROLES_LIST.Admin, ROLES_LIST.Company, ROLES_LIST.Driver]), (req, res, next) => bookingController.updateBookingStatus(req, res, next, io));

    router.route('/cancel/:id')
        .put(verifyRoles([ROLES_LIST.Admin, ROLES_LIST.Individual]), (req, res, next) => bookingController.cancelBooking(req, res, next, io));

    router.route('/assign-driver/:id')
        .put(verifyRoles([ROLES_LIST.Admin, ROLES_LIST.Company]), (req, res, next) => bookingController.assignDriverToBooking(req, res, next, io));

    return router;
};
