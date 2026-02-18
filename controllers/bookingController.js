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

module.exports = {
  createBooking,
  getAllBookings,
  getUserBookings,
};
