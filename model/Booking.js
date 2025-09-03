const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    // Link to the user who made the booking (the customer)
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User' 
    },
    // Link to the vehicle being booked
    vehicleId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Vehicle'
    },
    // Link to the driver assigned to the booking (optional at creation)
    driverProfileId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DriverProfile',
        default: null
    },
    // The company that owns the vehicle and is providing the service
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Company'
    },
    // Booking details
    pickupLocation: {
        type: String,
        required: true
    },
    dropOffLocation: {
        type: String,
        required: true
    },
    // The calculated price of the trip
    totalPrice: {
        type: Number,
        required: true,
        min: 0
    },
    // The current status of the booking
    status: {
        type: String,
        required: true,
        enum: ['pending', 'accepted', 'in_progress', 'completed', 'cancelled'],
        default: 'pending'
    },
    // Payment status
    isPaid: {
        type: Boolean,
        default: false
    },
    // Additional notes or special instructions
    notes: {
        type: String,
        maxlength: 500
    },
    // Time the booking is scheduled for
    scheduledTime: {
        type: Date,
        required: true
    },
    // Time the trip was completed
    completionTime: {
        type: Date,
    }
}, {
    timestamps: true // Adds createdAt and updatedAt fields
});

module.exports = mongoose.model('Booking', bookingSchema);