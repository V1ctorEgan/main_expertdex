const mongoose = require('mongoose');
 
const driverSchema = new mongoose.Schema({
    // Link to the User account (Driver can be an 'individual' user type)
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User', // References your User model
        unique: true // A user can only register as a driver once
    },
    // Optional: Link to the Company if the driver is employed by a company
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company', // References your Company model
        required: function() {
            // This field is required if the driver is associated with a company.
            // You might have a separate flag or determine this based on context.
            // For now, it's optional, indicating individual drivers also exist.
            return false; // Set to true if all drivers MUST belong to a company
        }
    },
    licenseNumber: { // Unique driver's license number
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    licenseExpirationDate: {
        type: Date,
        required: true
    },
    driverRating: { // Average rating from completed bookings
        type: Number,
        min: 1,
        max: 5,
        default: 5
    },
    currentLocation: { // For tracking driver's current position
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
    isActive: { // To indicate if the driver is currently available for assignments/bookings
        type: Boolean,
        default: true
    },
    assignedVehicle:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Vehicle',
        default:null
    },
    vehicleId: { // Optional: The ID of the vehicle the driver is currently assigned to or uses
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle'
    },
  
    profilePictureUrl: {
        type: String,
        default: 'null'
    },
    
}, {
    timestamps: true // Adds createdAt and updatedAt fields automatically
});

module.exports = mongoose.model('Driver', driverSchema);