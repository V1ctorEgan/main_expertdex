const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CompanyProfiles",
      required: [true, "Company ID is required"],
    },

    // Vehicle Details
    type: {
      type: String,
      enum: ["bike", "van", "pickup", "truck"],
      required: [true, "Vehicle type is required"],
    },
    name: {
      type: String,
      required: [true, "Vehicle name is required"],
      trim: true,
    },
    model: {
      type: String,
      required: [true, "Vehicle model/year is required"],
      trim: true,
    },
    color: {
      type: String,
      required: [true, "Vehicle color is required"],
      trim: true,
    },
    plateNumber: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
    },

    // Documents
    licenseImage: {
      type: String, // base64 or URL
      required: [true, "License/registration image is required"],
    },
    nin: {
      type: String,
      required: [true, "NIN is required"],
      trim: true,
    },

    // Pricing & Status
    basePrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },

    // Assignment
    assignedDriverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DriverProfiles",
      default: null,
    },
    isAssigned: {
      type: Boolean,
      default: false,
    },

    // Usage Stats (for future)
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

// Index for faster queries
vehicleSchema.index({ companyId: 1, isActive: 1 });
vehicleSchema.index({ assignedDriverId: 1 });

module.exports = mongoose.model("Vehicles", vehicleSchema);
