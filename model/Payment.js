const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    // Reference to booking
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bookings",
      required: true,
    },

    // User who made the payment
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },

    // Payment Details
    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    method: {
      type: String,
      enum: ["card", "cash", "wallet", "transfer", "ussd"],
      required: true,
    },

    // Payment Status
    status: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },

    // Paystack Details
    reference: {
      type: String,
      unique: true,
      required: true,
    },

    paystackReference: {
      type: String,
      default: null,
    },

    accessCode: {
      type: String,
      default: null,
    },

    authorizationUrl: {
      type: String,
      default: null,
    },

    // Transaction Details (from Paystack)
    transactionId: {
      type: String,
      default: null,
    },

    channel: {
      type: String, // card, bank, ussd, etc
      default: null,
    },

    currency: {
      type: String,
      default: "NGN",
    },

    // Card Details (if card payment)
    cardDetails: {
      brand: String,
      last4: String,
      bank: String,
    },

    // Refund Details
    refundReason: {
      type: String,
      default: "",
    },

    refundedAt: {
      type: Date,
      default: null,
    },

    refundAmount: {
      type: Number,
      default: 0,
    },

    // Metadata
    metadata: {
      type: Object,
      default: {},
    },

    // Timestamps
    paidAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
paymentSchema.index({ bookingId: 1 });
paymentSchema.index({ userId: 1 });
// paymentSchema.index({ reference: 1 });
paymentSchema.index({ status: 1 });

module.exports = mongoose.model("Payments", paymentSchema);
