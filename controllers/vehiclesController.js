const Vehicle = require("../model/Vehicles");
const CompanyProfile = require("../model/CompanyProfile");
const DriverProfile = require("../model/DriverProfile");

/**
 * Add Vehicle (Company)
 * POST /vehicle
 */
const addVehicle = async (req, res) => {
  try {
    const {
      type,
      name,
      model,
      color,
      plateNumber,
      licenseImage,
      nin,
      basePrice,
      isActive,
    } = req.body;

    // Validation
    if (!type || !name || !model || !color || !licenseImage || !nin) {
      return res.status(400).json({
        message:
          "Vehicle type, name, model, color, license image, and NIN are required.",
      });
    }

    // Get company from JWT token
    const userId = req.userId; // Set by verifyJWT middleware
    const companyProfile = await CompanyProfile.findOne({ userId });

    if (!companyProfile) {
      return res.status(404).json({
        message: "Company profile not found.",
      });
    }

    // Create vehicle
    const vehicle = await Vehicle.create({
      companyId: companyProfile._id,
      type,
      name,
      model,
      color,
      plateNumber: plateNumber || "",
      licenseImage,
      nin,
      basePrice: basePrice || 0,
      isActive: isActive !== false, // Default to true
      isAssigned: false,
    });

    // Update company's total vehicles count
    await CompanyProfile.findByIdAndUpdate(companyProfile._id, {
      $inc: { totalVehicles: 1 },
    });

    res.status(201).json({
      success: true,
      message: "Vehicle added successfully!",
      data: vehicle,
    });
  } catch (err) {
    console.error("Add vehicle error:", err);
    res.status(500).json({
      message: "Failed to add vehicle.",
      error: err.message,
    });
  }
};

/**
 * Get All Vehicles for a Company
 * GET /vehicle
 */
const getCompanyVehicles = async (req, res) => {
  try {
    const userId = req.userId;
    const companyProfile = await CompanyProfile.findOne({ userId });

    if (!companyProfile) {
      return res.status(404).json({
        message: "Company profile not found.",
      });
    }

    const vehicles = await Vehicle.find({ companyId: companyProfile._id })
      .populate("assignedDriverId", "firstName lastName phone email")
      .sort({ createdAt: -1 })
      .exec();

    res.status(200).json({
      success: true,
      count: vehicles.length,
      data: vehicles,
    });
  } catch (err) {
    console.error("Get vehicles error:", err);
    res.status(500).json({
      message: "Failed to fetch vehicles.",
      error: err.message,
    });
  }
};

/**
 * Get Single Vehicle
 * GET /vehicle/:id
 */
const getVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const vehicle = await Vehicle.findById(id)
      .populate("assignedDriverId", "firstName lastName phone email")
      .populate("companyId", "enterpriseName contactEmail")
      .exec();

    if (!vehicle) {
      return res.status(404).json({
        message: "Vehicle not found.",
      });
    }

    // Verify vehicle belongs to this company (unless admin)
    if (req.accountType !== "admin") {
      const companyProfile = await CompanyProfile.findOne({ userId });
      if (
        !companyProfile ||
        !vehicle.companyId._id.equals(companyProfile._id)
      ) {
        return res.status(403).json({
          message:
            "Access denied. This vehicle does not belong to your company.",
        });
      }
    }

    res.status(200).json({
      success: true,
      data: vehicle,
    });
  } catch (err) {
    console.error("Get vehicle error:", err);
    res.status(500).json({
      message: "Failed to fetch vehicle.",
      error: err.message,
    });
  }
};

/**
 * Update Vehicle
 * PUT /vehicle/:id
 */
const updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const updateData = req.body;

    // Prevent updating sensitive fields
    delete updateData.companyId;
    delete updateData.totalTrips;
    delete updateData.totalRevenue;

    // Find vehicle
    const vehicle = await Vehicle.findById(id);

    if (!vehicle) {
      return res.status(404).json({
        message: "Vehicle not found.",
      });
    }

    // Verify ownership (unless admin)
    if (req.accountType !== "admin") {
      const companyProfile = await CompanyProfile.findOne({ userId });
      if (!companyProfile || !vehicle.companyId.equals(companyProfile._id)) {
        return res.status(403).json({
          message:
            "Access denied. This vehicle does not belong to your company.",
        });
      }
    }

    // Update vehicle
    const updatedVehicle = await Vehicle.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("assignedDriverId", "firstName lastName phone email")
      .exec();

    res.status(200).json({
      success: true,
      message: "Vehicle updated successfully.",
      data: updatedVehicle,
    });
  } catch (err) {
    console.error("Update vehicle error:", err);
    res.status(500).json({
      message: "Failed to update vehicle.",
      error: err.message,
    });
  }
};

/**
 * Delete Vehicle
 * DELETE /vehicle/:id
 */
const deleteVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    // Find vehicle
    const vehicle = await Vehicle.findById(id);

    if (!vehicle) {
      return res.status(404).json({
        message: "Vehicle not found.",
      });
    }

    // Verify ownership (unless admin)
    if (req.accountType !== "admin") {
      const companyProfile = await CompanyProfile.findOne({ userId });
      if (!companyProfile || !vehicle.companyId.equals(companyProfile._id)) {
        return res.status(403).json({
          message:
            "Access denied. This vehicle does not belong to your company.",
        });
      }
    }

    // Check if vehicle is assigned to a driver
    if (vehicle.isAssigned && vehicle.assignedDriverId) {
      return res.status(400).json({
        message:
          "Cannot delete vehicle. It is currently assigned to a driver. Please unassign first.",
      });
    }

    // Delete vehicle
    await Vehicle.findByIdAndDelete(id);

    // Update company's total vehicles count
    await CompanyProfile.findByIdAndUpdate(vehicle.companyId, {
      $inc: { totalVehicles: -1 },
    });

    res.status(200).json({
      success: true,
      message: "Vehicle deleted successfully.",
    });
  } catch (err) {
    console.error("Delete vehicle error:", err);
    res.status(500).json({
      message: "Failed to delete vehicle.",
      error: err.message,
    });
  }
};

/**
 * Assign Vehicle to Driver
 * PUT /vehicle/:vehicleId/assign/:driverId
 */
const assignVehicleToDriver = async (req, res) => {
  try {
    const { vehicleId, driverId } = req.params;
    const userId = req.userId;

    // Find vehicle
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({
        message: "Vehicle not found.",
      });
    }

    // Find driver
    const driver = await DriverProfile.findById(driverId);
    if (!driver) {
      return res.status(404).json({
        message: "Driver not found.",
      });
    }

    // Verify ownership
    const companyProfile = await CompanyProfile.findOne({ userId });
    if (!companyProfile || !vehicle.companyId.equals(companyProfile._id)) {
      return res.status(403).json({
        message: "Access denied. This vehicle does not belong to your company.",
      });
    }

    // Check if vehicle is already assigned
    if (vehicle.isAssigned) {
      return res.status(400).json({
        message: "Vehicle is already assigned to another driver.",
      });
    }

    // Check if driver already has a vehicle assigned
    if (driver.assignedVehicleId) {
      return res.status(400).json({
        message: "Driver already has a vehicle assigned.",
      });
    }

    // Assign vehicle to driver
    vehicle.assignedDriverId = driver._id;
    vehicle.isAssigned = true;
    await vehicle.save();

    // Update driver's assigned vehicle
    driver.assignedVehicleId = vehicle._id;
    driver.companyId = companyProfile._id; // Also assign driver to company
    await driver.save();

    // Update company's driver count if driver wasn't already assigned
    if (!driver.companyId || !driver.companyId.equals(companyProfile._id)) {
      await CompanyProfile.findByIdAndUpdate(companyProfile._id, {
        $inc: { totalDrivers: 1 },
      });
    }

    res.status(200).json({
      success: true,
      message: "Vehicle assigned to driver successfully.",
      data: {
        vehicle: await Vehicle.findById(vehicleId).populate(
          "assignedDriverId",
          "firstName lastName",
        ),
        driver: await DriverProfile.findById(driverId).populate(
          "assignedVehicleId",
          "name model color",
        ),
      },
    });
  } catch (err) {
    console.error("Assign vehicle error:", err);
    res.status(500).json({
      message: "Failed to assign vehicle.",
      error: err.message,
    });
  }
};

/**
 * Unassign Vehicle from Driver
 * PUT /vehicle/:vehicleId/unassign
 */
const unassignVehicle = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const userId = req.userId;

    // Find vehicle
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({
        message: "Vehicle not found.",
      });
    }

    // Verify ownership
    const companyProfile = await CompanyProfile.findOne({ userId });
    if (!companyProfile || !vehicle.companyId.equals(companyProfile._id)) {
      return res.status(403).json({
        message: "Access denied.",
      });
    }

    if (!vehicle.isAssigned) {
      return res.status(400).json({
        message: "Vehicle is not assigned to any driver.",
      });
    }

    const driverId = vehicle.assignedDriverId;

    // Unassign vehicle
    vehicle.assignedDriverId = null;
    vehicle.isAssigned = false;
    await vehicle.save();

    // Update driver
    if (driverId) {
      await DriverProfile.findByIdAndUpdate(driverId, {
        assignedVehicleId: null,
      });
    }

    res.status(200).json({
      success: true,
      message: "Vehicle unassigned successfully.",
      data: vehicle,
    });
  } catch (err) {
    console.error("Unassign vehicle error:", err);
    res.status(500).json({
      message: "Failed to unassign vehicle.",
      error: err.message,
    });
  }
};

module.exports = {
  addVehicle,
  getCompanyVehicles,
  getVehicle,
  updateVehicle,
  deleteVehicle,
  assignVehicleToDriver,
  unassignVehicle,
};
