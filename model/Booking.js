const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    // User who created the booking
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: [true, "User ID is required"],
    },

    // Driver assigned to the booking
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DriverProfiles",
      default: null,
    },

    // Company (if applicable)
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CompanyProfiles",
      default: null,
    },

    // Pickup Location
    pickupLocation: {
      latitude: {
        type: Number,
        required: [true, "Pickup latitude is required"],
      },
      longitude: {
        type: Number,
        required: [true, "Pickup longitude is required"],
      },
      address: {
        type: String,
        required: [true, "Pickup address is required"],
      },
    },

    // Dropoff Location
    dropoffLocation: {
      latitude: {
        type: Number,
        required: [true, "Dropoff latitude is required"],
      },
      longitude: {
        type: Number,
        required: [true, "Dropoff longitude is required"],
      },
      address: {
        type: String,
        required: [true, "Dropoff address is required"],
      },
    },

    // Booking Details
    distance: {
      type: Number, // in kilometers
      required: true,
      min: 0,
    },
    vehicleType: {
      type: String,
      enum: ["bike", "van", "pickup", "truck"],
      required: [true, "Vehicle type is required"],
    },

    // Pricing
    estimatedPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    actualPrice: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Status
    status: {
      type: String,
      enum: ["pending", "accepted", "in_progress", "completed", "cancelled"],
      default: "pending",
    },

    // Payment
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "wallet", "transfer", "ussd"],
      default: "cash",
    },

    // Dates
    scheduledDate: {
      type: Date,
      default: Date.now,
    },
    acceptedDate: {
      type: Date,
      default: null,
    },
    startedDate: {
      type: Date,
      default: null,
    },
    completedDate: {
      type: Date,
      default: null,
    },
    cancelledDate: {
      type: Date,
      default: null,
    },

    // Additional Info
    notes: {
      type: String,
      default: "",
    },
    cancellationReason: {
      type: String,
      default: "",
    },

    // Rating (after completion)
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    review: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

// Indexes for faster queries
bookingSchema.index({ userId: 1, status: 1 });
bookingSchema.index({ driverId: 1, status: 1 });
bookingSchema.index({ status: 1, vehicleType: 1 });
bookingSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Bookings", bookingSchema);
