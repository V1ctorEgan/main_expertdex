const Payment = require('../model/Payment');
const Booking = require('../model/Booking');

// Mock payment gateway to simulate API interactions
const mockPaymentGateway = {
    createPaymentIntent: (amount, currency) => {
        return {
            transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            clientSecret: `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            status: 'pending'
        };
    },
    // In a real app, this would be a webhook endpoint
    processPaymentSuccess: (transactionId) => {
        return {
            status: 'succeeded',
            message: 'Payment successful'
        };
    }
};

// --- Initiate a payment for a booking ---
const initiatePayment = async (req, res) => {
    const { bookingId } = req.body;
    const loggedInUserId = req.userId;

    if (!bookingId) {
        return res.status(400).json({ 'message': 'Booking ID is required to initiate payment.' });
    }

    try {
        const booking = await Booking.findById(bookingId).exec();
        if (!booking) {
            return res.status(404).json({ 'message': 'Booking not found.' });
        }

        // Access control: Ensure the user owns the booking
        if (booking.customerId.toString() !== loggedInUserId) {
            return res.status(403).json({ 'message': 'Forbidden: You can only initiate payment for your own bookings.' });
        }

        // Check if the booking has already been paid
        if (booking.isPaid) {
            return res.status(409).json({ 'message': 'This booking has already been paid for.' });
        }

        // Create a payment intent using the mock gateway
        const paymentIntent = mockPaymentGateway.createPaymentIntent(booking.totalPrice, 'NGN');

        // Create a new Payment document in your database
        const newPayment = await Payment.create({
            bookingId: booking._id,
            transactionId: paymentIntent.transactionId,
            amount: booking.totalPrice,
            currency: 'NGN',
            paymentStatus: paymentIntent.status,
            gatewayResponse: paymentIntent
        });

        // Send back the transaction info for the client to use
        res.status(200).json({
            message: 'Payment initiated successfully.',
            transactionId: paymentIntent.transactionId,
            clientSecret: paymentIntent.clientSecret
        });

    } catch (err) {
        console.error("Error initiating payment:", err);
        res.status(500).json({ "message": "Server error while initiating payment." });
    }
};

// --- Handle payment success (simulated webhook) ---
// This would be a webhook endpoint in a real application
const handlePaymentSuccess = async (req, res) => {
    // In a real scenario, this would be a payload from the gateway.
    const { transactionId } = req.body;

    if (!transactionId) {
        return res.status(400).json({ 'message': 'Transaction ID is required.' });
    }

    try {
        const payment = await Payment.findOne({ transactionId: transactionId }).exec();
        if (!payment) {
            return res.status(404).json({ 'message': 'Payment transaction not found.' });
        }

        // Process the success from the mock gateway
        const gatewayResponse = mockPaymentGateway.processPaymentSuccess(transactionId);
        
        // Update the Payment status
        payment.paymentStatus = gatewayResponse.status;
        const updatedPayment = await payment.save();

        // Update the associated Booking status to paid
        const booking = await Booking.findById(payment.bookingId).exec();
        if (booking) {
            booking.isPaid = true;
            await booking.save();
        }

        res.status(200).json({
            message: "Payment processed successfully. Booking updated.",
            payment: updatedPayment
        });

    } catch (err) {
        console.error("Error processing payment success:", err);
        res.status(500).json({ "message": "Server error while processing payment success." });
    }
};

module.exports = {
    initiatePayment,
    handlePaymentSuccess
};