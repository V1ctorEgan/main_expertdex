// routes/api/booking.js
const express = require("express");
const router = express.Router();
const bookingController = require("../../controllers/bookingController");
const verifyRoles = require("../../middleware/verifyRoles");
const { ROLES_LIST } = require("../../config/roles_list");

// All routes require JWT (applied in server.js)
module.e;
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

module.exports = router;
