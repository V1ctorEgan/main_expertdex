// routes/api/booking.js
const express = require("express");
const bookingController = require("../../controllers/bookingController");
const verifyRoles = require("../../middleware/verifyRoles");
const { ROLES_LIST } = require("../../config/roles_list");

// This route exports a function that accepts io (Socket.IO instance)
module.exports = function (io) {
  const router = express.Router();

  // All routes require JWT (applied in server.js)

  // Estimate price (public for logged-in users)
  router.post("/estimate", bookingController.estimatePrice);

  // Create booking (any authenticated user)
  router.post("/", bookingController.createBooking);

  // Get all bookings (admin only)
  router.get(
    "/",
    verifyRoles([ROLES_LIST.Admin]),
    bookingController.getAllBookings,
  );

  // Get user's own bookings
  router.get("/my", bookingController.getUserBookings);

  // Get single booking details
  router.get("/:bookingId", bookingController.getBookingDetails);

  // Cancel booking
  router.put("/:bookingId/cancel", bookingController.cancelBooking);

  // Rate booking
  router.post("/:bookingId/rate", bookingController.rateBooking);

  return router;
};
