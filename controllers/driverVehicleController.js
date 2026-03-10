const DriverVehicle = require("../model/driverVehicle");
const DriverProfile = require("../model/DriverProfile");
const {
  validateVehicleType,
  getVehicleSubtypeInfo,
} = require("../config/vehicleTypes");

/**
 * Get Driver Profile with Vehicles
 * GET /api/driver/profile
 */
const getDriverProfile = async (req, res) => {
  try {
    const userId = req.userId;

    // Find driver profile
    const driverProfile = await DriverProfile.findOne({ userId })
      .populate("userId", "email name phoneNumber isVerified")
      .exec();

    if (!driverProfile) {
      return res.status(404).json({
        message: "Driver profile not found.",
      });
    }

    // Get driver's vehicles
    const vehicles = await DriverVehicle.find({
      driverId: driverProfile._id,
      isActive: true,
    });

    // Format response
    const profile = {
      id: driverProfile._id,
      firstName: driverProfile.firstName,
      lastName: driverProfile.lastName,
      email: driverProfile.userId.email,
      phone: driverProfile.phone,
      profileImage: driverProfile.profileImage || null,
      gender: driverProfile.gender,
      dob: driverProfile.dob,
      vehicles: vehicles.map((v) => ({
        id: v._id,
        vehicleType: v.vehicleType,
        vehicleSubtype: v.vehicleSubtype,
        vehicleName: v.vehicleName,
        vehicleModel: v.vehicleModel,
        color: v.color,
        capacity: v.capacity,
        isActive: v.isActive,
        status: v.status,
        totalTrips: v.totalTrips,
        createdAt: v.createdAt,
      })),
      licenseVerified: driverProfile.isVerified,
      nin: driverProfile.nin,
      availabilityStatus: driverProfile.isAvailable ? "available" : "offline",
      completedJobs: 0, // TODO: Calculate from bookings
      rating: 0, // TODO: Calculate from ratings
    };

    res.status(200).json(profile);
  } catch (err) {
    console.error("Get driver profile error:", err);
    res.status(500).json({
      message: "Failed to fetch driver profile.",
      error: err.message,
    });
  }
};

/**
 * Add Driver Vehicle
 * POST /api/driver/vehicles
 */
const addDriverVehicle = async (req, res) => {
  try {
    const userId = req.userId;
    const {
      vehicleType,
      vehicleSubtype,
      vehicleName,
      vehicleModel,
      color,
      licenseImage,
      nin,
      isActive = true,
    } = req.body;

    // Validation
    if (!vehicleType || !vehicleSubtype || !color) {
      return res.status(400).json({
        message: "Vehicle type, subtype, and color are required.",
      });
    }

    // Validate vehicle type and subtype combination
    if (!validateVehicleType(vehicleType, vehicleSubtype)) {
      return res.status(400).json({
        message: "Invalid vehicle type and subtype combination.",
      });
    }

    // Find driver profile
    const driverProfile = await DriverProfile.findOne({ userId });

    if (!driverProfile) {
      return res.status(404).json({
        message: "Driver profile not found.",
      });
    }

    // Get vehicle capacity from config
    const subtypeInfo = getVehicleSubtypeInfo(vehicleType, vehicleSubtype);
    const capacity = subtypeInfo ? subtypeInfo.capacity : "";

    // Create vehicle
    const vehicle = await DriverVehicle.create({
      driverId: driverProfile._id,
      vehicleType,
      vehicleSubtype,
      vehicleName: vehicleName || "",
      vehicleModel: vehicleModel || "",
      color,
      capacity,
      licenseImage: licenseImage || "",
      nin: nin || driverProfile.nin || "",
      isActive,
      status: "available",
    });

    res.status(201).json({
      success: true,
      message: "Vehicle added successfully",
      vehicle: {
        id: vehicle._id,
        vehicleType: vehicle.vehicleType,
        vehicleSubtype: vehicle.vehicleSubtype,
        vehicleName: vehicle.vehicleName,
        vehicleModel: vehicle.vehicleModel,
        color: vehicle.color,
        capacity: vehicle.capacity,
        isActive: vehicle.isActive,
        status: vehicle.status,
      },
    });
  } catch (err) {
    console.error("Add driver vehicle error:", err);
    res.status(500).json({
      message: "Failed to add vehicle.",
      error: err.message,
    });
  }
};

/**
 * Update Driver Vehicle
 * PUT /api/driver/vehicles/:vehicleId
 */
const updateDriverVehicle = async (req, res) => {
  try {
    const userId = req.userId;
    const { vehicleId } = req.params;
    const {
      vehicleType,
      vehicleSubtype,
      vehicleName,
      vehicleModel,
      color,
      licenseImage,
      nin,
      isActive,
    } = req.body;

    // Find driver profile
    const driverProfile = await DriverProfile.findOne({ userId });

    if (!driverProfile) {
      return res.status(404).json({
        message: "Driver profile not found.",
      });
    }

    // Find vehicle
    const vehicle = await DriverVehicle.findOne({
      _id: vehicleId,
      driverId: driverProfile._id,
    });

    if (!vehicle) {
      return res.status(404).json({
        message: "Vehicle not found or does not belong to you.",
      });
    }

    // Validate vehicle type if provided
    if (vehicleType && vehicleSubtype) {
      if (!validateVehicleType(vehicleType, vehicleSubtype)) {
        return res.status(400).json({
          message: "Invalid vehicle type and subtype combination.",
        });
      }
      vehicle.vehicleType = vehicleType;
      vehicle.vehicleSubtype = vehicleSubtype;

      // Update capacity
      const subtypeInfo = getVehicleSubtypeInfo(vehicleType, vehicleSubtype);
      vehicle.capacity = subtypeInfo ? subtypeInfo.capacity : vehicle.capacity;
    }

    // Update other fields
    if (vehicleName !== undefined) vehicle.vehicleName = vehicleName;
    if (vehicleModel !== undefined) vehicle.vehicleModel = vehicleModel;
    if (color !== undefined) vehicle.color = color;
    if (licenseImage !== undefined) vehicle.licenseImage = licenseImage;
    if (nin !== undefined) vehicle.nin = nin;
    if (isActive !== undefined) vehicle.isActive = isActive;

    await vehicle.save();

    res.status(200).json({
      success: true,
      message: "Vehicle updated successfully",
      vehicle: {
        id: vehicle._id,
        vehicleType: vehicle.vehicleType,
        vehicleSubtype: vehicle.vehicleSubtype,
        vehicleName: vehicle.vehicleName,
        vehicleModel: vehicle.vehicleModel,
        color: vehicle.color,
        capacity: vehicle.capacity,
        isActive: vehicle.isActive,
        status: vehicle.status,
      },
    });
  } catch (err) {
    console.error("Update driver vehicle error:", err);
    res.status(500).json({
      message: "Failed to update vehicle.",
      error: err.message,
    });
  }
};

/**
 * Get Driver Vehicles List
 * GET /api/driver/vehicles
 */
const getDriverVehicles = async (req, res) => {
  try {
    const userId = req.userId;

    // Find driver profile
    const driverProfile = await DriverProfile.findOne({ userId });

    if (!driverProfile) {
      return res.status(404).json({
        message: "Driver profile not found.",
      });
    }

    // Get all vehicles
    const vehicles = await DriverVehicle.find({
      driverId: driverProfile._id,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: vehicles.length,
      vehicles: vehicles.map((v) => ({
        id: v._id,
        vehicleType: v.vehicleType,
        vehicleSubtype: v.vehicleSubtype,
        vehicleName: v.vehicleName,
        vehicleModel: v.vehicleModel,
        color: v.color,
        capacity: v.capacity,
        isActive: v.isActive,
        status: v.status,
        totalTrips: v.totalTrips,
        totalRevenue: v.totalRevenue,
        createdAt: v.createdAt,
      })),
    });
  } catch (err) {
    console.error("Get driver vehicles error:", err);
    res.status(500).json({
      message: "Failed to fetch vehicles.",
      error: err.message,
    });
  }
};

/**
 * Delete Driver Vehicle
 * DELETE /api/driver/vehicles/:vehicleId
 */
const deleteDriverVehicle = async (req, res) => {
  try {
    const userId = req.userId;
    const { vehicleId } = req.params;

    // Find driver profile
    const driverProfile = await DriverProfile.findOne({ userId });

    if (!driverProfile) {
      return res.status(404).json({
        message: "Driver profile not found.",
      });
    }

    // Find and delete vehicle
    const vehicle = await DriverVehicle.findOneAndDelete({
      _id: vehicleId,
      driverId: driverProfile._id,
    });

    if (!vehicle) {
      return res.status(404).json({
        message: "Vehicle not found or does not belong to you.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Vehicle deleted successfully",
    });
  } catch (err) {
    console.error("Delete driver vehicle error:", err);
    res.status(500).json({
      message: "Failed to delete vehicle.",
      error: err.message,
    });
  }
};

/**
 * Update Driver Availability Status
 * PUT /api/driver/availability
 */
const updateDriverAvailability = async (req, res) => {
  try {
    const userId = req.userId;
    const { status } = req.body;

    if (!status || !["available", "busy", "offline"].includes(status)) {
      return res.status(400).json({
        message: "Invalid status. Must be: available, busy, or offline.",
      });
    }

    // Find driver profile
    const driverProfile = await DriverProfile.findOne({ userId });

    if (!driverProfile) {
      return res.status(404).json({
        message: "Driver profile not found.",
      });
    }

    // Update availability
    driverProfile.isAvailable = status === "available";
    await driverProfile.save();

    res.status(200).json({
      success: true,
      message: "Availability status updated",
      currentStatus: status,
      availableForJobs: status === "available",
    });
  } catch (err) {
    console.error("Update driver availability error:", err);
    res.status(500).json({
      message: "Failed to update availability.",
      error: err.message,
    });
  }
};

/**
 * Get Driver Availability Status
 * GET /api/driver/availability
 */
const getDriverAvailability = async (req, res) => {
  try {
    const userId = req.userId;

    // Find driver profile
    const driverProfile = await DriverProfile.findOne({ userId });

    if (!driverProfile) {
      return res.status(404).json({
        message: "Driver profile not found.",
      });
    }

    // Get active vehicles
    const vehicles = await DriverVehicle.find({
      driverId: driverProfile._id,
      isActive: true,
    });

    const currentStatus = driverProfile.isAvailable ? "available" : "offline";

    res.status(200).json({
      driverId: driverProfile._id,
      currentStatus,
      availableForJobs: driverProfile.isAvailable,
      lastUpdated: driverProfile.updatedAt,
      currentVehicles: vehicles.map((v) => ({
        id: v._id,
        vehicleType: v.vehicleType,
        vehicleSubtype: v.vehicleSubtype,
        color: v.color,
        isActive: v.isActive,
        status: v.status,
      })),
    });
  } catch (err) {
    console.error("Get driver availability error:", err);
    res.status(500).json({
      message: "Failed to fetch availability status.",
      error: err.message,
    });
  }
};

module.exports = {
  getDriverProfile,
  addDriverVehicle,
  updateDriverVehicle,
  getDriverVehicles,
  deleteDriverVehicle,
  updateDriverAvailability,
  getDriverAvailability,
};
