const mongoose = require("mongoose");

const companyProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
      unique: true, // One company profile per user
    },

    // Basic Company Information
    companyImage: {
      type: String, // base64 string or URL
      default: null,
    },
    enterpriseName: {
      type: String,
      required: [true, "Enterprise name is required"],
      trim: true,
    },
    enterpriseDescription: {
      type: String,
      required: [true, "Enterprise description is required"],
      trim: true,
    },
    enterpriseSize: {
      type: String,
      enum: ["1-10", "11-50", "51-200", "200+"],
      required: [true, "Enterprise size is required"],
    },
    companyLogo: {
      type: String, // base64 string or URL
      default: null,
    },

    // Contact Information
    contactName: {
      type: String,
      required: [true, "Contact name is required"],
      trim: true,
    },
    contactEmail: {
      type: String,
      required: [true, "Contact email is required"],
      trim: true,
      lowercase: true,
      match: [/.+@.+\..+/, "Please fill a valid email address"],
    },

    // Verification & Documentation
    taxId: {
      type: String,
      trim: true,
      default: "",
    },
    taxIdApplicable: {
      type: Boolean,
      default: true, // If false, small enterprise doesn't need tax ID
    },
    nin: {
      type: String,
      required: [true, "NIN is required"],
      trim: true,
    },
    cacDocument: {
      type: String, // base64 string or URL (CAC Registration Certificate)
      required: [true, "CAC Registration Certificate is required"],
    },
    cacDocumentDetails: {
      type: String,
      required: [true, "Document details are required"],
      trim: true,
    },

    // Terms & Conditions
    acceptTerms: {
      type: Boolean,
      default: false,
    },

    // Verification Status
    isVerified: {
      type: Boolean,
      default: false, // Admin verifies company documents
    },
    isApproved: {
      type: Boolean,
      default: false, // Admin approves company
    },

    // Company Stats (for future use)
    totalDrivers: {
      type: Number,
      default: 0,
    },
    totalVehicles: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  },
);

module.exports = mongoose.model("CompanyProfiles", companyProfileSchema);
