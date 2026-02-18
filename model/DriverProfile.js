const mongoose = require("mongoose");
const driverProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
      unique: true, // One driver profile per user
    },
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
    },
    profileImage: {
      type: String, // base64 string or URL
      default: null,
    },
    bio: {
      type: String,
      trim: true,
      default: "",
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
    },
    dob: {
      type: Date,
      required: [true, "Date of birth is required"],
    },
    gender: {
      type: String,
      enum: ["Male", "Female"],
      required: [true, "Gender is required"],
    },
    ownCar: {
      type: String,
      enum: ["yes", "no"],
      required: [true, "Please indicate if you own a car"],
    },

    // Vehicle Information (only if ownCar === "yes")
    vehicle: {
      vehicleName: {
        type: String,
        default: "",
      },
      vehicleModel: {
        type: String,
        default: "",
      },
      vehicleColor: {
        type: String,
        default: "",
      },
    },

    // License & Registration
    licenseImage: {
      type: String, // base64 string or URL
      required: [true, "License image is required"],
    },
    nin: {
      type: String,
      required: [true, "NIN is required"],
      trim: true,
    },

    // Status & Assignment
    isAvailable: {
      type: Boolean,
      default: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CompanyProfiles",
      default: null, // null = independent driver, not assigned to any company
    },
    assignedVehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicles", // For when company assigns a vehicle
      default: null,
    },

    // Verification & Approval
    isVerified: {
      type: Boolean,
      default: false, // Admin verifies driver documents
    },
    isApproved: {
      type: Boolean,
      default: false, // Company or admin approves driver
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  },
);

module.exports = mongoose.model("DriverProfiles", driverProfileSchema);
