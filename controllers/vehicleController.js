const Vehicle = require("../model/Vehicle");
const Company = require("../model/Company");


const getAllVehicles = async (req,res) =>{
    const vehicles = await Vehicle.find();
    if (!vehicles || vehicles.length === 0) return res.status(204).json({"message": "no Vehicles found"});
    console.log(vehicles)
    res.json(vehicles);
}

const createNewVehicle = async (req, res) =>{
    const loggedInUserId = req.userId;
    const loggedInAccountType = req.accountType;


    const {type, make, model, year, licensePlate, basePrice, currentLocation, isAvailable, condition, description, capacity, imageUrl, category} = req.body;
    if (!type || !make || !model ||!year || !licensePlate || !basePrice || !category) {
        return res.status(400).json({'message': 'type, make, model, year, liscensePlate, basePrice, and category are required.' });
    }
    try{
        const company = await Company.findOne({ userId: loggedInUserId }).exec();
        if (!company) {
            // A company user must have a company profile to add vehicles
            return res.status(403).json({ "message": "Forbidden: Only companies with existing profiles can add vehicles." });
        }

        const result = await Vehicle.create({
            companyId:company._id,
            type: type, 
            make: make, 
            model: model, 
            year: year,
            licensePlate: licensePlate,
            basePrice: basePrice,
            currentLocation: currentLocation,
            isAvailable: isAvailable,
            condition:condition,
            description:description,
            capacity:capacity,
            imageUrl:imageUrl,
            category:category,
            

        });
        res.status(201).json(result)
    } catch(err){
        console.error(err)
        if (err.code === 11000) { // MongoDB duplicate key error code
            return res.status(409).json({ message: "Vehicle with one of the inputs already exists." });
        }
        res.status(500).json({ message: "Error creating Vehicle." });
    }
}

const updateVehicle = async (req, res) =>{
    const {type, make, model, year, licensePlate, basePrice, currentLocation, isAvailable, condition, description, capacity, imageUrl, category} = req.body;
    const VehicleId =  req.params.id
    const loggedInUserId = req.user;
    const loggedInAccountType = req.accountType;

    if (!VehicleId) return res.status(400).json({"message":"vehicle ID is require for update"});
    try{
        const vehicle = await Vehicle.findOne({_id : VehicleId}).exec();
        if (!vehicle) return res.send(404).json({"message":`no vehicle ID matches ${VehicleId}`});

        // Find the company associated with the logged-in user
        const userCompany = await Company.findOne({ userId: loggedInUserId }).exec();

        // If no company profile for the logged-in user, they can't own vehicles
        if (!userCompany) {
            return res.status(403).json({ message: 'Forbidden: You do not have a company profile to own vehicles.' });
        }

        // IMPORTANT: Ownership check. A company user should only update their own company.
        // This assumes req.user.id is the ID of the logged-in user.
        // And that company.userId is the ID of the user associated with this company.
        if (loggedInAccountType !== 'admin' && vehicle.companyId.toString() !== userCompany._id.toString()) {
            return res.status(403).json({ message: 'Forbidden: You can only update vehicles owned by your company.' });
        }

         // Applying updates conditionally
        if (type !== undefined) vehicle.type = type;
        if (make !== undefined) vehicle.make = make;
        if (model !== undefined) vehicle.model = model;
        if (year !== undefined) vehicle.year = year;
        if (licensePlate !== undefined) vehicle.licensePlate = licensePlate;
        if (basePrice !== undefined) vehicle.basePrice = basePrice;
        if (currentLocation !== undefined) vehicle.currentLocation = currentLocation;
        if (isAvailable !== undefined) vehicle.isAvailable = isAvailable;
        if (condition !== undefined) vehicle.condition = condition;
        if (description !== undefined) vehicle.description = description;
        if (capacity !== undefined) vehicle.capacity = capacity;
        if (imageUrl !== undefined) vehicle.imageUrl = imageUrl;
        if (category !== undefined) vehicle.category = category;
        const result = await vehicle.save();
        res.json(result);
    }catch(err){
        console.error(err);
        if (err.name === 'ValidationError') { // Handle Mongoose validation errors
            return res.status(400).json({ message: err.message });
        }
        if (err.code === 11000) { // MongoDB duplicate key error (most likely for licensePlate)
            return res.status(409).json({ message: "Vehicle with this license plate already exists." });
        }
        res.status(500).json({ message: "Error updating Vehicle." });
    }

}

const deleteVehicle = async (req, res) =>{
    const vehicleId =  req.params.id
    const loggedInUserId = req.user;
    const loggedInAccountType = req.accountType;

    if (!vehicleId) return res.status(400).json({"message":"vehicle ID required to delete"});

    try{
        const vehicle = await Vehicle.Vehicle.findById(vehicleId).exec();
        if(!vehicle) return res.send(404).json({"message":`no vehicle ID matches ${vehicleId}`});

        // ---  OWNERSHIP CHECK ---
        const userCompany = await Company.findOne({ userId: loggedInUserId }).exec();
        if (!userCompany) {
            return res.status(403).json({ message: 'Forbidden: You do not have a company profile to manage vehicles.' });
        }

        if (loggedInAccountType !== 'admin' && vehicle.companyId.toString() !== userCompany._id.toString()) {
            return res.status(403).json({ message: 'Forbidden: You can only delete vehicles owned by your company.' });
        }

        const result = await vehicle.deleteOne();
        res.json({ message: `Vehicle ${vehicle.make} ${vehicle.model} with ID ${vehicle._id} deleted successfully.` });
 
    }catch(err){
        console.error(err);
        res.status(500).json({ message: "Error deleting vehicle." });
    }
}

const getVehicle = async (req, res) => {
    const vehicleId = req.params.id;
    if (!vehicleId) return res.status(400).json({ 'message': 'Vehicle ID required.' });

    const vehicle = await Vehicle.findOne({ _id: req.params.userIdid }).exec();
    try{
        if (!vehicle) {
        return res.status(404).json({ "message": `No Vehicle matches ID ${req.params.userId}.` });
    }
    res.json(vehicle);
    }catch(err){
        console.error(err);
        if (err.name === 'CastError' && err.path === '_id') {
            return res.status(400).json({ message: "Invalid Vehicle ID format." });
        }
        res.status(500).json({ message: "Error retrieving vehicle." });
    }
    
}

module.exports = {getAllVehicles, getVehicle, createNewVehicle, deleteVehicle, updateVehicle};