const DriverProfile = require('../model/Driver');
const Vehicle = require("../model/Vehicle");
const User = require('../model/Users')
const Company = require("../model/Company");
const getAllDrivers = async (req, res) => {
    try {

        const driverProfiles = await DriverProfile.find()
            .populate('userId', 'firstName lastName email accountType')
            .populate('assignedVehicle', 'make model licensePlate') 
            .populate('companyId', 'name')
            .exec();

            if (!driverProfiles || driverProfiles.length === 0) {
            return res.status(204).json({ "message": "No driver profiles found." });
        }

        res.json(driverProfiles);

    } catch (err) {
        console.error("Error fetching all driver profiles:", err);
        res.status(500).json({ "message": "Server error while fetching driver profiles." });
    }
};

const assignVehicleToDriver = async (req, res) => {
    // Get the driver profile ID to be updated and the vehicle ID to assign.
    // Assuming this is a PUT request with a body like { "vehicleId": "..." }
    const { vehicleId } = req.body;
    const driverProfileId = req.params.id; // From the URL, e.g., /driver-profiles/assign/:id

    // Get the logged-in user's details for ownership/role checks
    const loggedInUserId = req.user.id;
    const loggedInAccountType = req.user.accountType;

    if (!driverProfileId || !vehicleId) {
        return res.status(400).json({ "message": "Driver profile ID and Vehicle ID are required for assignment." });
    }

    try {
       
        const driverProfile = await DriverProfile.findById(driverProfileId).exec();
        if (!driverProfile) {
            return res.status(404).json({ "message": `No driver profile matches ID ${driverProfileId}.` });
        }

        const vehicle = await Vehicle.findById(vehicleId).exec();
        if (!vehicle) {
            return res.status(404).json({ "message": `No vehicle matches ID ${vehicleId}.` });
        }

        // An Admin can assign any vehicle to any driver.
        // A Company user can only assign their OWN vehicles to drivers associated with their company.
        if (loggedInAccountType !== 'admin') {
            // Find the company profile linked to the logged-in user
            const userCompany = await Company.findOne({ userId: loggedInUserId }).exec();
            if (!userCompany) {
                return res.status(403).json({ message: "Forbidden: You do not have a company profile to manage vehicles." });
            }

            // Check if the vehicle belongs to the logged-in user's company
            if (vehicle.companyId.toString() !== userCompany._id.toString()) {
                return res.status(403).json({ message: "Forbidden: You can only assign vehicles from your own company." });
            }

            // Check if the driver is associated with this company
            if (driverProfile.companyId && driverProfile.companyId.toString() !== userCompany._id.toString()) {
                return res.status(403).json({ message: "Forbidden: You can only assign vehicles to drivers in your company." });
            }
        }

        // Step 4: Check if the vehicle is available for assignment
        // The vehicle must not be assigned to another driver.
        const currentlyAssignedDriver = await DriverProfile.findOne({ assignedVehicle: vehicleId }).exec();
        if (currentlyAssignedDriver && currentlyAssignedDriver._id.toString() !== driverProfileId) {
            return res.status(409).json({ message: `Vehicle with ID ${vehicleId} is already assigned to another driver.` });
        }

        // Step 5: Update the driver profile with the new vehicle ID
        driverProfile.assignedVehicle = vehicleId;
        const result = await driverProfile.save();
        res.json({ message: "Vehicle assigned successfully.", driverProfile: result });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error assigning vehicle to driver." });
    }
};




const createNewDriverProfile = async (req, res) => {
    // Get the user's ID and account type from the JWT token
    const loggedInUserId = req.userId;
    const loggedInAccountType = req.accountType;

    // Destructure required driver profile details from the request body
    const { licenseNumber, licenseExpirationDate } = req.body;

    // Basic validation
    if (!licenseNumber || !licenseExpirationDate) {
        return res.status(400).json({ 'message': 'License number and expiration date are required.' });
    }

    try {
        // Step 1: Verify the logged-in user is meant to be a driver
        if (loggedInAccountType !== 'driver') {
            return res.status(403).json({ "message": "Forbidden: Only users with a 'driver' account type can create a driver profile." });
        }

        // Step 2: Check if a driver profile already exists for this user
        const existingProfile = await DriverProfile.findOne({ userId: loggedInUserId }).exec();
        if (existingProfile) {
            return res.status(409).json({ "message": "A driver profile already exists for this user." });
        }

        // Step 3: Create the new driver profile document
        const newDriverProfile = await DriverProfile.create({
            userId: loggedInUserId,
            licenseNumber,
            licenseExpirationDate
        });

        // Respond with the newly created profile
        res.status(201).json(newDriverProfile);

    } catch (err) {
        console.error("Error creating driver profile:", err);
        if (err.code === 11000) {
            return res.status(409).json({ message: "A profile with this license number already exists or a profile has already been created for this user." });
        }
        res.status(500).json({ message: "Error creating driver profile." });
    }
};



const updateDriverProfile = async (req, res) => {
    // Get the driver profile ID from the URL parameter
    const driverProfileId = req.params.id;
    // Get user details from the JWT
    const loggedInUserId = req.userId;
    const loggedInAccountType = req.accountType;

    // Destructure updatable fields from the request body
    const { licenseNumber, licenseExpirationDate, driverRating, currentLocation, isActive, assignedVehicle, companyId } = req.body;

    if (!driverProfileId) {
        return res.status(400).json({ "message": "Driver profile ID is required for update." });
    }

    try {
        const driverProfile = await DriverProfile.findById(driverProfileId).exec();

        if (!driverProfile) {
            return res.status(404).json({ "message": `No driver profile matches ID ${driverProfileId}.` });
        }

        // --- OWNERSHIP AND ROLE-BASED ACCESS CONTROL ---
        // An Admin can update any driver's profile.
        // A Company can only update the profiles of drivers linked to their company.
        // A Driver can only update their own profile.

        // Is the user an admin?
        if (loggedInAccountType !== 'admin') {
            // If not an admin, check if the user is a company manager
            if (loggedInAccountType === 'company') {
                const userCompany = await Company.findOne({ userId: loggedInUserId }).exec();
                // Check if the driver is linked to this user's company
                if (!userCompany || driverProfile.companyId?.toString() !== userCompany._id.toString()) {
                    return res.status(403).json({ message: "Forbidden: You can only update driver profiles linked to your company." });
                }
            }
            // Or is the user a driver trying to update their own profile?
            else if (driverProfile.userId.toString() !== loggedInUserId) {
                 return res.status(403).json({ message: 'Forbidden: You can only update your own driver profile.' });
            }
        }
        // --- END OF ACCESS CONTROL ---

        // Apply conditional updates
        if (licenseNumber !== undefined) driverProfile.licenseNumber = licenseNumber;
        if (licenseExpirationDate !== undefined) driverProfile.licenseExpirationDate = licenseExpirationDate;
        if (driverRating !== undefined) driverProfile.driverRating = driverRating;
        if (currentLocation !== undefined) driverProfile.currentLocation = currentLocation;
        if (isActive !== undefined) driverProfile.isActive = isActive;
        if (assignedVehicle !== undefined) driverProfile.assignedVehicle = assignedVehicle;
        if (companyId !== undefined) driverProfile.companyId = companyId;

        const result = await driverProfile.save();
        res.json(result);

    } catch (err) {
        console.error("Error updating driver profile:", err);
        if (err.name === 'ValidationError') {
            return res.status(400).json({ message: err.message });
        }
        if (err.code === 11000) {
            return res.status(409).json({ message: "A profile with this license number already exists." });
        }
        res.status(500).json({ message: "Server error during driver profile update." });
    }
};



const deleteDriverProfile = async (req, res) => {
    // Get the driver profile ID from the URL parameter
    const driverProfileId = req.params.id;
    // Get user details from the JWT
    const loggedInUserId = req.userId;
    const loggedInAccountType = req.accountType;

    if (!driverProfileId) {
        return res.status(400).json({ "message": "Driver profile ID is required for deletion." });
    }

    try {
        const driverProfile = await DriverProfile.findById(driverProfileId).exec();

        if (!driverProfile) {
            return res.status(404).json({ "message": `No driver profile matches ID ${driverProfileId}.` });
        }

        // --- OWNERSHIP AND ROLE-BASED ACCESS CONTROL ---
        // Only an Admin can delete a driver profile.
        // A company can only "de-activate" a driver, not delete their profile entirely.
        if (loggedInAccountType !== 'admin') {
            return res.status(403).json({ message: 'Forbidden: Only administrators can delete a driver profile.' });
        }
        // --- END OF ACCESS CONTROL ---

        const result = await driverProfile.deleteOne();
        res.json({ message: `Driver profile with ID ${result._id} has been deleted.` });

    } catch (err) {
        console.error("Error deleting driver profile:", err);
        res.status(500).json({ "message": "Server error during driver profile deletion." });
    }
};


const getDriverProfile = async (req, res) => {
    // Get the driver profile ID from the URL parameter
    const driverProfileId = req.params.id;

    if (!driverProfileId) {
        return res.status(400).json({ 'message': 'Driver profile ID is required.' });
    }

    try {
        // Find the driver profile by its ID and populate the 'userId' field
        const driverProfile = await DriverProfile.findById(driverProfileId)
            .populate('userId', 'firstName lastName email accountType')
            .exec();

        // If no driver profile is found, return 404 Not Found
        if (!driverProfile) {
            return res.status(404).json({ "message": `No driver profile matches ID ${driverProfileId}.` });
        }

        // Return the found driver profile
        res.json(driverProfile);

    } catch (err) {
        console.error("Error fetching driver profile:", err);
        // Handle case where the ID format is invalid (e.g., not a valid MongoDB ObjectId)
        if (err.name === 'CastError' && err.path === '_id') {
            return res.status(400).json({ message: "Invalid driver profile ID format." });
        }
        res.status(500).json({ "message": "Server error while fetching driver profile." });
    }
};
module.exports = {assignVehicleToDriver, getAllDrivers, updateDriverProfile, deleteDriverProfile, getDriverProfile, createNewDriverProfile}