const Booking = require('../model/Booking');
const User = require('../model/Users');
const Vehicle = require('../model/Vehicle');
const Company = require('../model/Company');
const DriverProfile = require('../model/DriverProfile')

// Mock function to simulate distance calculation.
// In a real application, you'd use a service like Google Maps API.
const calculateDistance = (pickup, dropoff) => {
    // For now, return a random distance in km for demonstration
    return Math.floor(Math.random() * 100) + 10;
};

// --- Create a new booking ---
const createNewBooking = async (req, res, next, io) => {
    const loggedInUserId = req.userId;
    const { vehicleId, pickupLocation, dropOffLocation, scheduledTime } = req.body;

    // Basic validation
    if (!vehicleId || !pickupLocation || !dropOffLocation || !scheduledTime) {
        return res.status(400).json({ 'message': 'Vehicle ID, pickup location, drop-off location, and scheduled time are required.' });
    }

    try {
        const vehicle = await Vehicle.findById(vehicleId).exec();
        if (!vehicle) {
            return res.status(404).json({ 'message': `No vehicle matches ID ${vehicleId}.` });
        }

        // Check if the vehicle is available for a new booking
        if (!vehicle.isAvailable) {
            return res.status(409).json({ 'message': 'This vehicle is currently not available for booking.' });
        }

        // Calculate distance and total price
        const distance = calculateDistance(pickupLocation, dropOffLocation);
        const totalPrice = distance * vehicle.basePrice;

        const newBooking = await Booking.create({
            customerId: loggedInUserId,
            vehicleId,
            companyId: vehicle.companyId, // Link booking to the vehicle's company
            pickupLocation,
            dropOffLocation,
            totalPrice,
            scheduledTime,
            isPaid: false, // Default to not paid
            status: 'pending' // Default to pending
        });

        // Update the vehicle's availability status
        vehicle.isAvailable = false;
        await vehicle.save();

        // Emit a real-time event for companies and drivers to see new bookings
        io.to('company').emit('new-booking-created', {
            message: 'A new booking has been created.',
            booking: newBooking
        });

        res.status(201).json(newBooking);

    } catch (err) {
        console.error("Error creating booking:", err);
        res.status(500).json({ "message": "Server error while creating booking." });
    }
};

// --- Get all bookings with role-based access control ---
const getAllBookings = async (req, res) => {
    const loggedInUserId = req.userId;
    const loggedInAccountType = req.accountType;
    let filter = {};

    try {
        // Set the filter based on the user's role
        if (loggedInAccountType === 'individual') {
            filter = { customerId: loggedInUserId };
        } else if (loggedInAccountType === 'company') {
            const userCompany = await Company.findOne({ userId: loggedInUserId }).exec();
            if (!userCompany) {
                return res.status(403).json({ message: "Forbidden: You do not have a company profile." });
            }
            filter = { companyId: userCompany._id };
        } else if (loggedInAccountType === 'driver') {
            const driverProfile = await DriverProfile.findOne({ userId: loggedInUserId }).exec();
            if (!driverProfile) {
                return res.status(403).json({ message: "Forbidden: You do not have a driver profile." });
            }
            filter = { driverProfileId: driverProfile._id };
        }
        // Admin role has no filter, so they see all bookings by default

        const bookings = await Booking.find(filter)
            .populate('customerId', 'firstName lastName')
            .populate('vehicleId', 'make model licensePlate')
            .populate('driverProfileId', 'licenseNumber')
            .exec();

        if (!bookings || bookings.length === 0) {
            return res.status(204).json({ "message": "No bookings found." });
        }

        res.json(bookings);

    } catch (err) {
        console.error("Error fetching bookings:", err);
        res.status(500).json({ "message": "Server error while fetching bookings." });
    }
};

// --- Get a single booking ---
const getBooking = async (req, res) => {
    const bookingId = req.params.id;
    const loggedInUserId = req.userId;
    const loggedInAccountType = req.accountType;

    if (!bookingId) {
        return res.status(400).json({ 'message': 'Booking ID is required.' });
    }

    try {
        const booking = await Booking.findById(bookingId)
            .populate('customerId', 'firstName lastName email')
            .populate('vehicleId', 'make model licensePlate')
            .populate('driverProfileId', 'licenseNumber')
            .populate('companyId', 'name')
            .exec();

        if (!booking) {
            return res.status(404).json({ 'message': `No booking matches ID ${bookingId}.` });
        }

        // --- Access Control for single booking ---
        const customerId = booking.customerId.toString();
        const companyId = booking.companyId.toString();

        let authorized = false;
        if (loggedInAccountType === 'admin' || customerId === loggedInUserId) {
            authorized = true;
        } else if (loggedInAccountType === 'company') {
            const userCompany = await Company.findOne({ userId: loggedInUserId }).exec();
            if (userCompany && companyId === userCompany._id.toString()) {
                authorized = true;
            }
        } else if (loggedInAccountType === 'driver') {
             const driverProfile = await DriverProfile.findOne({ userId: loggedInUserId }).exec();
             if (driverProfile && booking.driverProfileId?.toString() === driverProfile._id.toString()) {
                 authorized = true;
             }
        }
        if (!authorized) {
            return res.status(403).json({ message: 'Forbidden: You do not have permission to view this booking.' });
        }
        // --- End of Access Control ---

        res.json(booking);

    } catch (err) {
        console.error("Error fetching booking:", err);
        if (err.name === 'CastError') {
            return res.status(400).json({ message: "Invalid booking ID format." });
        }
        res.status(500).json({ "message": "Server error while fetching booking." });
    }
};

// --- Update a booking's status (for Company and Admin) ---
const updateBookingStatus = async (req, res, next, io) => {
    const bookingId = req.params.id;
    const { status } = req.body;
    const loggedInUserId = req.userId;
    const loggedInAccountType = req.accountType;

    if (!bookingId || !status) {
        return res.status(400).json({ message: 'Booking ID and new status are required.' });
    }

    try {
        const booking = await Booking.findById(bookingId).exec();
        if (!booking) {
            return res.status(404).json({ message: `No booking matches ID ${bookingId}.` });
        }

        // --- Access Control for status update ---
        const companyId = booking.companyId.toString();
        let authorized = false;

        if (loggedInAccountType === 'admin') {
            authorized = true;
        } else if (loggedInAccountType === 'company') {
            const userCompany = await Company.findOne({ userId: loggedInUserId }).exec();
            if (userCompany && companyId === userCompany._id.toString()) {
                authorized = true;
            }
        } else if (loggedInAccountType === 'driver') {
            // Drivers can update the status to 'in_progress' or 'completed' for their assigned bookings
            const driverProfile = await DriverProfile.findOne({ userId: loggedInUserId }).exec();
            if (driverProfile && booking.driverProfileId?.toString() === driverProfile._id.toString()) {
                authorized = true;
            }
        }

        if (!authorized) {
            return res.status(403).json({ message: 'Forbidden: You do not have permission to update this booking status.' });
        }

        // Check if the status change is valid
        if (!['accepted', 'in_progress', 'completed', 'cancelled'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status provided.' });
        }

        booking.status = status;
        // If the booking is completed, update the completion time and vehicle status
        if (status === 'completed') {
            booking.completionTime = new Date();
            const vehicle = await Vehicle.findById(booking.vehicleId).exec();
            if (vehicle) {
                vehicle.isAvailable = true;
                await vehicle.save();
            }
            const customerId = booking.customerId.toString();
            // Use io to emit an event to the specific customer
            // In a real app, you'd track users by their ID and emit to their specific socket
            io.to(customerId).emit('booking-completed', {
                message: `Your trip has been completed!`,
                bookingId: booking._id
            });
        }

        const result = await booking.save();
        res.json(result);

    } catch (err) {
        console.error("Error updating booking status:", err);
        res.status(500).json({ message: "Server error while updating booking status." });
    }
};


// --- Cancel a booking (for customer and admin) ---
const cancelBooking = async (req, res) => {
    const bookingId = req.params.id;
    const loggedInUserId = req.userId;
    const loggedInAccountType = req.accountType;

    if (!bookingId) {
        return res.status(400).json({ message: 'Booking ID is required for cancellation.' });
    }

    try {
        const booking = await Booking.findById(bookingId).exec();
        if (!booking) {
            return res.status(404).json({ message: `No booking matches ID ${bookingId}.` });
        }

        // --- Access Control for cancellation ---
        const customerId = booking.customerId.toString();
        let authorized = false;

        if (loggedInAccountType === 'admin' || customerId === loggedInUserId) {
            authorized = true;
        }

        if (!authorized) {
            return res.status(403).json({ message: 'Forbidden: You do not have permission to cancel this booking.' });
        }

        // Set status to cancelled
        booking.status = 'cancelled';
        const result = await booking.save();

        // Release the vehicle so it can be booked again
        const vehicle = await Vehicle.findById(booking.vehicleId).exec();
        if (vehicle) {
            vehicle.isAvailable = true;
            await vehicle.save();
        }

        res.json(result);

    } catch (err) {
        console.error("Error cancelling booking:", err);
        res.status(500).json({ message: "Server error while cancelling booking." });
    }
};

const assignDriverToBooking = async (req, res) => {
    // Get the booking ID from the URL and the driver ID from the body
    const bookingId = req.params.id;
    const { driverProfileId } = req.body;

    // Get the logged-in user's details for role-based access
    const loggedInUserId = req.userId;
    const loggedInAccountType = req.accountType;

    // Basic validation
    if (!bookingId || !driverProfileId) {
        return res.status(400).json({ "message": "Booking ID and Driver Profile ID are required for assignment." });
    }

    try {
        // Step 1: Find the booking and the driver's profile
        const booking = await Booking.findById(bookingId).exec();
        const driverProfile = await DriverProfile.findById(driverProfileId).exec();

        if (!booking) {
            return res.status(404).json({ "message": `No booking matches ID ${bookingId}.` });
        }
        if (!driverProfile) {
            return res.status(404).json({ "message": `No driver profile matches ID ${driverProfileId}.` });
        }

        // Step 2: Access Control
        // Only an Admin or a Company can assign a driver.
        // A company can only assign a driver to a booking for one of their vehicles.
        if (loggedInAccountType !== 'admin') {
            if (loggedInAccountType === 'company') {
                const userCompany = await Company.findOne({ userId: loggedInUserId }).exec();
                if (!userCompany || booking.companyId.toString() !== userCompany._id.toString()) {
                    return res.status(403).json({ "message": "Forbidden: You can only assign drivers to bookings for your company." });
                }
            } else {
                return res.status(403).json({ "message": "Forbidden: You do not have permission to assign a driver." });
            }
        }
        
        // Step 3: Check driver status and availability
        if (!driverProfile.isActive) {
            return res.status(409).json({ "message": "The selected driver is not currently active and cannot be assigned." });
        }

        // Step 4: Check for driver scheduling conflicts
        // Find other bookings this driver is assigned to.
        const conflictingBooking = await Booking.findOne({
            driverProfileId: driverProfileId,
            status: { $in: ['accepted', 'in_progress'] },
            _id: { $ne: bookingId }, // Exclude the current booking itself
            scheduledTime: {
                $lte: booking.scheduledTime,
                // In a more complex system, you'd check for overlapping end times
                // For simplicity, we'll assume a driver can't be assigned to any other booking after this one starts.
            }
        }).exec();

        if (conflictingBooking) {
            return res.status(409).json({ "message": "The selected driver is already assigned to a conflicting booking." });
        }

        // Step 5: Assign the driver and update booking status
        booking.driverProfileId = driverProfileId;
        booking.status = 'accepted'; // Automatically mark the booking as accepted once a driver is assigned

        const result = await booking.save();
        res.json({ "message": "Driver assigned successfully.", "booking": result });

    } catch (err) {
        console.error("Error assigning driver to booking:", err);
        res.status(500).json({ "message": "Server error while assigning driver to booking." });
    }
};

module.exports = {
    createNewBooking,
    getAllBookings,
    getBooking,
    updateBookingStatus,
    cancelBooking,
    assignDriverToBooking
};
