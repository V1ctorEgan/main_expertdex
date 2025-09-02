const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
    // Link to the Company that owns this vehicle
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Company' // This references your Company model
    },
    type: {
        type: String,
        required: true,
        enum: ['truck', 'bus', 'pickup', 'tool'] // As per your project description
    },
    make: {
        type: String,
        required: true
    },
    model: {
        type: String,
        required: true
    },
    year: {
        type: Number,
        required: true
    },
    licensePlate: { // Unique identifier for the vehicle
        type: String,
        required: true,
        unique: true
    },
    basePrice: { // Base rate per km
        type: Number,
        required: true,
        min: 0
    },
    currentLocation: { // Optional: for tracking vehicle's current position
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            default: [0, 0]
        }
    },
    isAvailable: { // To indicate if the vehicle can be booked
        type: Boolean,
        default: true
    },
    condition: { // e.g., new, used, excellent, good, fair
        type: String,
        enum: ['new', 'excellent', 'good', 'fair', 'poor'], // Example conditions
        default: 'good'
    },
    description: {
        type: String,
        maxlength: 500
    },
    capacity: { // e.g., tonnage for trucks, passenger count for buses
        type: String // You might want to define specific units (e.g., "5 tons", "40 passengers")
    },
    imageUrl: { // For storing a URL to an image of the vehicle
        type: String
    },
    // Subcategory or category (e.g., Normal Pickup or Big Pickup)
    category: {
        type: String,
        required: true
    }
}, {
    timestamps: true // Adds createdAt and updatedAt fields automatically
});

module.exports = mongoose.model('Vehicle', vehicleSchema);