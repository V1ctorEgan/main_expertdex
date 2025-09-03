const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Booking'
    },
    transactionId: { // The ID returned by the payment gateway
        type: String,
        required: true,
        unique: true
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        required: true,
        default: 'NGN' // Assuming Nigerian Naira as the default currency
    },
    paymentStatus: {
        type: String,
        required: true,
        enum: ['pending', 'succeeded', 'failed', 'cancelled'],
        default: 'pending'
    },
    gatewayResponse: { // Store the full response from the payment gateway
        type: Object
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Payment', paymentSchema);