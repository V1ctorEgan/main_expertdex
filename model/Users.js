const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true, // Emails should be unique for login
      trim: true,
      lowercase: true, // Store emails in lowercase for consistency
      match: [/.+@.+\..+/, "Please fill a valid email address"], // Basic email regex validation
    },

    accountType: {
      type: String,
      enum: ["individual", "company", "driver", "admin"], // Enforces specific values
      required: [true, "Account type is required"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"], // Good practice for password strength
    },
    phoneNumber: {
      type: Number,
      required: true,
    },
    // We'll store the refresh token directly on the user for simplicity,
    // though for high-security apps, a separate collection or secure cookie is often preferred.
    refreshToken: {
      type: String,
      // It's often good practice not to make this required, as users won't have one initially
      // and it changes upon refresh/logout.
    },
    isVerified: {
      // For email verification (Step 4 in ExpertDex docs)
      type: Boolean,
      default: false,
    },
  },
  {
    // Adds createdAt and updatedAt timestamps automatically
    timestamps: true,
  }
);

module.exports = mongoose.model("Users", userSchema);
