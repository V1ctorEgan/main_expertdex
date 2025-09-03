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


const createNewDriver = async (req, res) =>{
    const loggedInUserId = req.userId;
    const loggedInAccountType = req.accountType;
    const {licenseNumber, licenseExpirationDate, driverRating, currentLocation, coordinates, isActive, profilePictureUrl} = req.body;
    
    if (!licenseNumber || !licenseExpirationDate) return res.status(400).json({"message":'liscenseNumber and license Expiration number required'})
    try{
        const user = await User.findById(loggedInUserId);
        if (!user) return res.status(404).json({"message":`no driver ID matches ${loggedInUserId}`})
        const result = Driver.create
    }catch(err){

    }


}

const updateDriver = async (req, res) =>{
    const loggedInUserId = req.userId;
    const loggedInAccountType = req.accountType;

}

const deleteDriver = async (req, res) => {
    const driverId = req.body.id || req.params.id;
    if (!driverId) return res.status(400).json({ 'message': 'Driver ID required.' });
        try {
            const driver = await Driver.findOne({ _id: driverId }).exec();
    
            if (!company) {
                return res.status(204).json({ "message": `No company matches ID ${driverId}.` });
            }
    
            // IMPORTANT: Ownership/Authorization check for deletion
            if (req.user && driver.userId.toString() !== req.userId && req.accountType !== 'admin') {
                return res.status(403).json({ message: 'Forbidden: You can only delete your own driver profile.' });
            }
    
            const result = await driver.deleteOne();
            res.json({ message: `Driver ${driver.name} with ID ${driver._id} deleted successfully.` });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: "Error deleting driver." });
        }

}