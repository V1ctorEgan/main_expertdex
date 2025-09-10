const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
    // Reference to the User model, linking a 'company' accountType user to this company profile.
    // This allows you to easily find the associated company details for a logged-in company user.
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users', // Refers to the 'User' model
        required: true,
        unique: true // A user can only be linked to one company profile
    },
    name: {
        type: String,
        required: [true, 'Company name is required'],
        trim: true,
        unique: true // Company names should ideally be unique
    },
    address: {
        street: String,
        city: String,
        state: String,
        zipCode: String
    },
    contactEmail: { // Specific email for company contact
        type: String,
        trim: true,
        lowercase: true,
        match: [/.+@.+\..+/, 'Please fill a valid contact email address']
    },
    contactPhone: { // Specific phone for company contact
        type: String,
        trim: true
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    // You might add fields like industry, website, registration number if relevant
    industry: {
        type: String,
        trim: true
    },
    website: {
        type: String,
        trim: true
    }
}, {
    // Mongoose will automatically add 'createdAt' and 'updatedAt' fields
    timestamps: true
});

module.exports = mongoose.model('Company', companySchema);