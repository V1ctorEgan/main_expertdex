const Payment = require("../model/Payment");
const Booking = require("../model/Booking");
const axios = require("axios");
const crypto = require("crypto");

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = "https://api.paystack.co";

/**
 * Initialize Payment
 * POST /payments/initialize
 */
const initializePayment = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const userId = req.userId;

    if (!bookingId) {
      return res.status(400).json({
        message: "Booking ID is required.",
      });
    }

    // Get booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        message: "Booking not found.",
      });
    }

    // Verify booking belongs to user
    if (!booking.userId.equals(userId)) {
      return res.status(403).json({
        message: "Access denied. This booking does not belong to you.",
      });
    }

    // Check if booking is completed
    if (booking.status !== "completed") {
      return res.status(400).json({
        message: "You can only pay for completed bookings.",
      });
    }

    // Check if already paid
    if (booking.paymentStatus === "paid") {
      return res.status(400).json({
        message: "This booking has already been paid for.",
      });
    }

    // Check if payment already exists
    const existingPayment = await Payment.findOne({
      bookingId,
      status: { $in: ["pending", "paid"] },
    });

    if (existingPayment && existingPayment.status === "paid") {
      return res.status(400).json({
        message: "Payment already completed for this booking.",
      });
    }

    // Generate unique reference
    const reference = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Get user details
    const User = require("../model/Users");
    const user = await User.findById(userId);

    // Amount in kobo (Paystack uses kobo)
    const amountInKobo = booking.actualPrice * 100;

    // Initialize payment with Paystack
    const paystackResponse = await axios.post(
      `${PAYSTACK_BASE_URL}/transaction/initialize`,
      {
        email: user.email,
        amount: amountInKobo,
        reference: reference,
        currency: "NGN",
        metadata: {
          bookingId: bookingId,
          userId: userId.toString(),
          custom_fields: [
            {
              display_name: "Booking ID",
              variable_name: "booking_id",
              value: bookingId,
            },
            {
              display_name: "Customer Name",
              variable_name: "customer_name",
              value: user.name,
            },
          ],
        },
        callback_url: `${process.env.FRONTEND_URL || "http://localhost:3001"}/payment/callback`,
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!paystackResponse.data.status) {
      return res.status(500).json({
        message: "Failed to initialize payment with Paystack.",
        error: paystackResponse.data.message,
      });
    }

    const paystackData = paystackResponse.data.data;

    // Create payment record
    const payment = await Payment.create({
      bookingId,
      userId,
      amount: booking.actualPrice,
      method: "card",
      status: "pending",
      reference,
      paystackReference: paystackData.reference,
      accessCode: paystackData.access_code,
      authorizationUrl: paystackData.authorization_url,
      currency: "NGN",
    });

    res.status(200).json({
      success: true,
      message: "Payment initialized successfully!",
      data: {
        paymentId: payment._id,
        reference: payment.reference,
        authorizationUrl: paystackData.authorization_url,
        accessCode: paystackData.access_code,
        amount: booking.actualPrice,
      },
    });
  } catch (err) {
    console.error("Initialize payment error:", err);
    res.status(500).json({
      message: "Failed to initialize payment.",
      error: err.response?.data?.message || err.message,
    });
  }
};

/**
 * Verify Payment
 * GET /payments/verify/:reference
 */
const verifyPayment = async (req, res) => {
  try {
    const { reference } = req.params;
    const userId = req.userId;

    // Find payment
    const payment = await Payment.findOne({ reference })
      .populate("bookingId")
      .exec();

    if (!payment) {
      return res.status(404).json({
        message: "Payment not found.",
      });
    }

    // Verify ownership
    if (!payment.userId.equals(userId)) {
      return res.status(403).json({
        message: "Access denied.",
      });
    }

    // If already verified as paid, return success
    if (payment.status === "paid") {
      return res.status(200).json({
        success: true,
        message: "Payment already verified.",
        data: {
          status: "paid",
          amount: payment.amount,
          paidAt: payment.paidAt,
        },
      });
    }

    // Verify with Paystack
    const paystackResponse = await axios.get(
      `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      },
    );

    if (!paystackResponse.data.status) {
      return res.status(400).json({
        message: "Payment verification failed.",
        error: paystackResponse.data.message,
      });
    }

    const paystackData = paystackResponse.data.data;

    // Check if payment was successful
    if (paystackData.status === "success") {
      // Update payment
      payment.status = "paid";
      payment.paidAt = new Date();
      payment.transactionId = paystackData.id;
      payment.channel = paystackData.channel;

      if (paystackData.authorization) {
        payment.cardDetails = {
          brand: paystackData.authorization.brand,
          last4: paystackData.authorization.last4,
          bank: paystackData.authorization.bank,
        };
      }

      await payment.save();

      // Update booking payment status
      const booking = await Booking.findById(payment.bookingId);
      booking.paymentStatus = "paid";
      booking.paymentMethod = "card";
      await booking.save();

      return res.status(200).json({
        success: true,
        message: "Payment verified successfully!",
        data: {
          status: "paid",
          amount: payment.amount,
          paidAt: payment.paidAt,
          reference: payment.reference,
          transactionId: payment.transactionId,
        },
      });
    } else {
      // Payment failed
      payment.status = "failed";
      await payment.save();

      return res.status(400).json({
        success: false,
        message: "Payment verification failed.",
        data: {
          status: paystackData.status,
          gatewayResponse: paystackData.gateway_response,
        },
      });
    }
  } catch (err) {
    console.error("Verify payment error:", err);
    res.status(500).json({
      message: "Failed to verify payment.",
      error: err.response?.data?.message || err.message,
    });
  }
};

/**
 * Record Cash Payment
 * POST /payments/cash
 */
const recordCashPayment = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const userId = req.userId;

    if (!bookingId) {
      return res.status(400).json({
        message: "Booking ID is required.",
      });
    }

    // Get booking
    const booking = await Booking.findById(bookingId)
      .populate("driverId", "firstName lastName")
      .exec();

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found.",
      });
    }

    // Verify this is the driver for this booking
    const DriverProfile = require("../model/DriverProfiles");
    const driverProfile = await DriverProfile.findOne({ userId });

    if (!driverProfile || !booking.driverId._id.equals(driverProfile._id)) {
      return res.status(403).json({
        message:
          "Access denied. Only the assigned driver can record cash payment.",
      });
    }

    // Check if booking is completed
    if (booking.status !== "completed") {
      return res.status(400).json({
        message: "Booking must be completed before recording payment.",
      });
    }

    // Check if already paid
    if (booking.paymentStatus === "paid") {
      return res.status(400).json({
        message: "This booking has already been paid for.",
      });
    }

    // Generate reference
    const reference = `CASH-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create payment record
    const payment = await Payment.create({
      bookingId,
      userId: booking.userId,
      amount: booking.actualPrice,
      method: "cash",
      status: "paid",
      reference,
      paidAt: new Date(),
      currency: "NGN",
    });

    // Update booking
    booking.paymentStatus = "paid";
    booking.paymentMethod = "cash";
    await booking.save();

    res.status(201).json({
      success: true,
      message: "Cash payment recorded successfully!",
      data: {
        paymentId: payment._id,
        reference: payment.reference,
        amount: payment.amount,
        method: "cash",
        status: "paid",
        paidAt: payment.paidAt,
      },
    });
  } catch (err) {
    console.error("Record cash payment error:", err);
    res.status(500).json({
      message: "Failed to record cash payment.",
      error: err.message,
    });
  }
};

/**
 * Get Payment History
 * GET /payments/history
 */
const getPaymentHistory = async (req, res) => {
  try {
    const userId = req.userId;
    const { status, method } = req.query;

    // Build query
    const query = { userId };

    if (status) {
      query.status = status;
    }

    if (method) {
      query.method = method;
    }

    const payments = await Payment.find(query)
      .populate(
        "bookingId",
        "pickupLocation dropoffLocation distance vehicleType",
      )
      .sort({ createdAt: -1 })
      .limit(100)
      .exec();

    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (err) {
    console.error("Get payment history error:", err);
    res.status(500).json({
      message: "Failed to fetch payment history.",
      error: err.message,
    });
  }
};

/**
 * Request Refund
 * POST /payments/refund
 */
const requestRefund = async (req, res) => {
  try {
    const { paymentId, reason } = req.body;
    const userId = req.userId;

    if (!paymentId || !reason) {
      return res.status(400).json({
        message: "Payment ID and refund reason are required.",
      });
    }

    // Get payment
    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({
        message: "Payment not found.",
      });
    }

    // Verify ownership
    if (!payment.userId.equals(userId)) {
      return res.status(403).json({
        message: "Access denied.",
      });
    }

    // Check if paid
    if (payment.status !== "paid") {
      return res.status(400).json({
        message: "Only paid transactions can be refunded.",
      });
    }

    // Check if already refunded
    if (payment.status === "refunded") {
      return res.status(400).json({
        message: "This payment has already been refunded.",
      });
    }

    // For now, just mark as refund requested
    // In production, you would integrate with Paystack refund API
    payment.refundReason = reason;
    payment.status = "refunded"; // In production, set to "refund_pending" until approved
    payment.refundedAt = new Date();
    payment.refundAmount = payment.amount;
    await payment.save();

    // Update booking
    const booking = await Booking.findById(payment.bookingId);
    if (booking) {
      booking.paymentStatus = "refunded";
      await booking.save();
    }

    res.status(200).json({
      success: true,
      message: "Refund processed successfully!",
      data: {
        paymentId: payment._id,
        refundAmount: payment.refundAmount,
        refundedAt: payment.refundedAt,
        status: "refunded",
      },
    });
  } catch (err) {
    console.error("Request refund error:", err);
    res.status(500).json({
      message: "Failed to process refund.",
      error: err.message,
    });
  }
};

module.exports = {
  initializePayment,
  verifyPayment,
  recordCashPayment,
  getPaymentHistory,
  requestRefund,
};
