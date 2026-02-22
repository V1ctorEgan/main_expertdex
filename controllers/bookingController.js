const Booking = require("../model/Booking");
const User = require("../model/Users");

/**
 * Create a Booking (For testing purposes)
 * POST /bookings
 */
const createBooking = async (req, res) => {
  try {
    const userId = req.userId;
    const {
      pickupLocation,
      dropoffLocation,
      distance,
      vehicleType,
      estimatedPrice,
      scheduledDate,
      notes,
    } = req.body;

    // Validation
    if (
      !pickupLocation ||
      !dropoffLocation ||
      !distance ||
      !vehicleType ||
      !estimatedPrice
    ) {
      return res.status(400).json({
        message:
          "Pickup location, dropoff location, distance, vehicle type, and estimated price are required.",
      });
    }

    // Create booking
    const booking = await Booking.create({
      userId,
      pickupLocation,
      dropoffLocation,
      distance,
      vehicleType,
      estimatedPrice,
      scheduledDate: scheduledDate || new Date(),
      notes: notes || "",
      status: "pending",
      paymentStatus: "pending",
    });

    const populatedBooking = await Booking.findById(booking._id)
      .populate("userId", "name email phoneNumber")
      .exec();

    res.status(201).json({
      success: true,
      message: "Booking created successfully!",
      data: populatedBooking,
    });
  } catch (err) {
    console.error("Create booking error:", err);
    res.status(500).json({
      message: "Failed to create booking.",
      error: err.message,
    });
  }
};

/**
 * Get All Bookings (for testing)
 * GET /bookings
 */
const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("userId", "name email phoneNumber")
      .populate("driverId", "firstName lastName phone")
      .sort({ createdAt: -1 })
      .exec();

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (err) {
    console.error("Get bookings error:", err);
    res.status(500).json({
      message: "Failed to fetch bookings.",
      error: err.message,
    });
  }
};

/**
 * Get User's Bookings
 * GET /bookings/my
 */
const getUserBookings = async (req, res) => {
  try {
    const userId = req.userId;

    const bookings = await Booking.find({ userId })
      .populate("driverId", "firstName lastName phone")
      .sort({ createdAt: -1 })
      .exec();

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (err) {
    console.error("Get user bookings error:", err);
    res.status(500).json({
      message: "Failed to fetch bookings.",
      error: err.message,
    });
  }
};

const getBookingDetails = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.userId;
    const accountType = req.accountType;

    const booking = await Booking.findById(bookingId)
      .populate("userId", "name email phoneNumber")
      .populate("driverId", "firstName lastName phone")
      .populate("companyId", "enterpriseName contactEmail")
      .exec();

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found.",
      });
    }

    // Authorization: Users can only see their own bookings (unless admin/driver/company)
    if (accountType === "individual") {
      if (!booking.userId._id.equals(userId)) {
        return res.status(403).json({
          message: "Access denied. This booking does not belong to you.",
        });
      }
    } else if (accountType === "driver") {
      // Driver can see bookings assigned to them
      const DriverProfile = require("../model/DriverProfiles");
      const driverProfile = await DriverProfile.findOne({ userId });
      if (booking.driverId && !booking.driverId._id.equals(driverProfile._id)) {
        return res.status(403).json({
          message: "Access denied. This booking is not assigned to you.",
        });
      }
    }

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (err) {
    console.error("Get booking details error:", err);
    res.status(500).json({
      message: "Failed to fetch booking details.",
      error: err.message,
    });
  }
};

/**
 * Estimate Booking Price
 * POST /bookings/estimate
 */
const estimatePrice = async (req, res) => {
  try {
    const { distance, vehicleType } = req.body;

    if (!distance || !vehicleType) {
      return res.status(400).json({
        message: "Distance and vehicle type are required.",
      });
    }

    // Pricing logic (simplified - you can make this more complex)
    const baseRates = {
      bike: 150, // ₦150 per km
      van: 300, // ₦300 per km
      pickup: 400, // ₦400 per km
      truck: 600, // ₦600 per km
    };

    const baseFare = {
      bike: 500, // ₦500 base fare
      van: 1000, // ₦1000 base fare
      pickup: 1500, // ₦1500 base fare
      truck: 2500, // ₦2500 base fare
    };

    const ratePerKm = baseRates[vehicleType] || 300;
    const baseCharge = baseFare[vehicleType] || 1000;

    const estimatedPrice = baseCharge + distance * ratePerKm;

    // Add surge pricing if needed (example: 20% surge during peak hours)
    const currentHour = new Date().getHours();
    const isPeakHour =
      (currentHour >= 7 && currentHour <= 9) ||
      (currentHour >= 17 && currentHour <= 19);
    const surgeMultiplier = isPeakHour ? 1.2 : 1.0;

    const finalPrice = Math.round(estimatedPrice * surgeMultiplier);

    res.status(200).json({
      success: true,
      data: {
        distance,
        vehicleType,
        baseFare: baseCharge,
        ratePerKm,
        estimatedPrice: finalPrice,
        breakdown: {
          baseFare: baseCharge,
          distanceFare: distance * ratePerKm,
          surge: isPeakHour ? "20% peak hour charge" : "No surge",
          total: finalPrice,
        },
      },
    });
  } catch (err) {
    console.error("Estimate price error:", err);
    res.status(500).json({
      message: "Failed to estimate price.",
      error: err.message,
    });
  }
};

/**
 * Cancel Booking
 * PUT /bookings/:bookingId/cancel
 */
const cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.userId;
    const { cancellationReason } = req.body;

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found.",
      });
    }

    // Only the user who created the booking can cancel it
    if (!booking.userId.equals(userId)) {
      return res.status(403).json({
        message: "Access denied. You can only cancel your own bookings.",
      });
    }

    // Can't cancel completed or already cancelled bookings
    if (booking.status === "completed") {
      return res.status(400).json({
        message: "Cannot cancel a completed booking.",
      });
    }

    if (booking.status === "cancelled") {
      return res.status(400).json({
        message: "This booking is already cancelled.",
      });
    }

    // Cancel the booking
    booking.status = "cancelled";
    booking.cancelledDate = new Date();
    booking.cancellationReason = cancellationReason || "Cancelled by user";
    await booking.save();

    // If driver was assigned, free them up
    if (booking.driverId) {
      const DriverProfile = require("../model/DriverProfiles");
      // Driver can now accept new jobs (this booking is cancelled)
    }

    res.status(200).json({
      success: true,
      message: "Booking cancelled successfully.",
      data: booking,
    });
  } catch (err) {
    console.error("Cancel booking error:", err);
    res.status(500).json({
      message: "Failed to cancel booking.",
      error: err.message,
    });
  }
};

/**
 * Rate Booking
 * POST /bookings/:bookingId/rate
 */
const rateBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.userId;
    const { rating, review } = req.body;

    // Validation
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        message: "Rating must be between 1 and 5.",
      });
    }

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found.",
      });
    }

    // Only the user who created the booking can rate it
    if (!booking.userId.equals(userId)) {
      return res.status(403).json({
        message: "Access denied. You can only rate your own bookings.",
      });
    }

    // Can only rate completed bookings
    if (booking.status !== "completed") {
      return res.status(400).json({
        message: "You can only rate completed bookings.",
      });
    }

    // Can't rate twice
    if (booking.rating) {
      return res.status(400).json({
        message: "You have already rated this booking.",
      });
    }

    // Add rating
    booking.rating = rating;
    booking.review = review || "";
    await booking.save();

    res.status(200).json({
      success: true,
      message: "Booking rated successfully!",
      data: {
        bookingId: booking._id,
        rating: booking.rating,
        review: booking.review,
      },
    });
  } catch (err) {
    console.error("Rate booking error:", err);
    res.status(500).json({
      message: "Failed to rate booking.",
      error: err.message,
    });
  }
};

module.exports = {
  createBooking,
  getAllBookings,
  getUserBookings,
  getBookingDetails,
  estimatePrice,
  cancelBooking,
  rateBooking,
};
