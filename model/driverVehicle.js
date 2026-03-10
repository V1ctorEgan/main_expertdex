const mongoose = require("mongoose");

const driverVehicleSchema = new mongoose.Schema(
  {
    // Driver reference
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DriverProfiles",
      required: true,
    },

    // Vehicle Type Information
    vehicleType: {
      type: String,
      enum: ["van", "pickup", "truck", "bike"],
      required: true,
    },

    vehicleSubtype: {
      type: String,
      required: true,
      // Subtypes will be validated based on vehicleType
    },

    // Vehicle Details
    vehicleName: {
      type: String,
      default: "",
    },

    vehicleModel: {
      type: String,
      default: "",
    },

    color: {
      type: String,
      required: true,
    },

    capacity: {
      type: String,
      default: "",
    },

    // Documents
    licenseImage: {
      type: String,
      default: "",
    },

    nin: {
      type: String,
      default: "",
    },

    // Status
    isActive: {
      type: Boolean,
      default: true,
    },

    status: {
      type: String,
      enum: ["available", "in_use", "maintenance"],
      default: "available",
    },

    // Verification
    isVerified: {
      type: Boolean,
      default: false,
    },

    verifiedAt: {
      type: Date,
      default: null,
    },

    // Stats
    totalTrips: {
      type: Number,
      default: 0,
    },

    totalRevenue: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
driverVehicleSchema.index({ driverId: 1 });
driverVehicleSchema.index({ vehicleType: 1 });
driverVehicleSchema.index({ status: 1 });
driverVehicleSchema.index({ isActive: 1 });

module.exports = mongoose.model("DriverVehicles", driverVehicleSchema);
