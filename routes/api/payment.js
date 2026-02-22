// routes/api/payment.js
const express = require("express");
const router = express.Router();
const paymentController = require("../../controllers/paymentController");
const verifyRoles = require("../../middleware/verifyRoles");
const { ROLES_LIST } = require("../../config/roles_list");

// All routes require JWT (applied in server.js)

// Initialize payment (card)
router.post("/initialize", paymentController.initializePayment);

// Verify payment
router.get("/verify/:reference", paymentController.verifyPayment);

// Record cash payment (drivers only)
router.post(
  "/cash",
  verifyRoles([ROLES_LIST.Driver]),
  paymentController.recordCashPayment,
);

// Get payment history
router.get("/history", paymentController.getPaymentHistory);

// Request refund
router.post("/refund", paymentController.requestRefund);

module.exports = router;
