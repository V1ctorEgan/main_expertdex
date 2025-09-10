const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { BOOKING_STATUS } = require('../config/bookingStatus');

const locationSchema = new Schema({
    latitude: {
        type: Number,
        required: true,
    },
    longitude: {
        type: Number,
        required: true,
    }
}, { _id: false }); // Disable a separate ID for this subdocument

const bookingSchema = new Schema({
    customerId: {
        type: Schema.Types.ObjectId,
        ref: 'User', // Reference the User model
        required: true,
    },
    vehicleId: {
        type: Schema.Types.ObjectId,
        ref: 'Vehicle', // Reference the Vehicle model
        required: true,
    },
    companyId: {
        type: Schema.Types.ObjectId,
        ref: 'Company', // Reference the Company model
        required: true,
    },
    driverProfileId: {
        type: Schema.Types.ObjectId,
        ref: 'DriverProfile', // Reference the DriverProfile model
    },
    pickupLocation: {
        type: locationSchema, // Use the new nested schema
        required: true,
    },
    dropOffLocation: {
        type: locationSchema, // Use the new nested schema
        required: true,
    },
    scheduledTime: {
        type: Date,
        required: true,
    },
    completionTime: {
        type: Date,
    },
    totalPrice: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: Object.values(BOOKING_STATUS), // Use enum to restrict values
        default: BOOKING_STATUS.PENDING,
        required: true,
    },
    isPaid: {
        type: Boolean,
        default: false,
    },
    // Optional field for payment method, e.g., 'cash', 'card'
    paymentMethod: {
        type: String,
    }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
