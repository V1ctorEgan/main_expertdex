const Driver = require('../model/Driver');
const Vehicle = require("../model/Vehicle");
const User = require('../model/Users')

const getAllDriver = async (req, res) =>{
    const drivers = await User.find({accountType: 'driver'});
    if (!drivers || drivers.length === 0) return res.send(204).json({"message":"no driver found"})
    res.json(drivers)
}

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