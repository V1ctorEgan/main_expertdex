const DriverProfile = require("../model/DriverProfile");
const DriverVehicle = require("../model/driverVehicle");
const CompanyProfile = require("../model/CompanyProfile");
const Vehicle = require("../model/Vehicles");
const VehicleAssignment = require("../model/vehicleAssignment");
const User = require("../model/Users");

/**
 * Get All Registered Drivers (for Company)
 * GET /api/company/drivers
 */
const getAllDrivers = async (req, res) => {
  try {
    const userId = req.userId;
    const {
      status,
      vehicleType,
      licenseVerified,
      search,
      page = 1,
    } = req.query;

    // Find company profile
    const companyProfile = await CompanyProfile.findOne({ userId });

    if (!companyProfile) {
      return res.status(404).json({
        message: "Company profile not found.",
      });
    }

    // Build query
    const query = {};

    // Filter by verification status
    if (licenseVerified !== undefined) {
      query.isVerified = licenseVerified === "true";
    }

    // Filter by availability
    if (status) {
      if (status === "available") query.isAvailable = true;
      else if (status === "offline") query.isAvailable = false;
    }

    // Text search
    if (search) {
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { phoneNumber: { $regex: search, $options: "i" } },
        ],
        accountType: "driver",
      }).select("_id");

      const userIds = users.map((u) => u._id);
      query.userId = { $in: userIds };
    }

    // Get drivers
    const limit = 20;
    const skip = (parseInt(page) - 1) * limit;

    const drivers = await DriverProfile.find(query)
      .populate("userId", "name email phoneNumber")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    // Get vehicles for each driver
    const driversWithVehicles = await Promise.all(
      drivers.map(async (driver) => {
        const vehicles = await DriverVehicle.find({
          driverId: driver._id,
          isActive: true,
        });

        const hasVehicle = vehicles.length > 0;
        const firstVehicle = vehicles[0];

        return {
          id: driver._id,
          name: `${driver.firstName} ${driver.lastName}`,
          email: driver.userId.email,
          phone: driver.phone,
          availabilityStatus: driver.isAvailable ? "available" : "offline",
          hasVehicle,
          vehicleType: firstVehicle ? firstVehicle.vehicleType : null,
          vehicleSubtype: firstVehicle ? firstVehicle.vehicleSubtype : null,
          vehicleName: firstVehicle ? firstVehicle.vehicleName : null,
          licenseVerified: driver.isVerified,
          rating: 0, // TODO: Calculate from ratings
          completedJobs: 0, // TODO: Calculate from bookings
          joinDate: driver.createdAt,
          profileImage: driver.profileImage || null,
        };
      }),
    );

    // Apply vehicle type filter
    let filteredDrivers = driversWithVehicles;
    if (vehicleType) {
      if (vehicleType === "has-vehicle") {
        filteredDrivers = driversWithVehicles.filter((d) => d.hasVehicle);
      } else if (vehicleType === "no-vehicle") {
        filteredDrivers = driversWithVehicles.filter((d) => !d.hasVehicle);
      } else {
        filteredDrivers = driversWithVehicles.filter(
          (d) => d.vehicleType === vehicleType,
        );
      }
    }

    res.status(200).json({
      success: true,
      count: filteredDrivers.length,
      drivers: filteredDrivers,
    });
  } catch (err) {
    console.error("Get all drivers error:", err);
    res.status(500).json({
      message: "Failed to fetch drivers.",
      error: err.message,
    });
  }
};

/**
 * Get Driver Details (for Company)
 * GET /api/company/drivers/:driverId
 */
const getDriverDetails = async (req, res) => {
  try {
    const { driverId } = req.params;

    // Find driver
    const driver = await DriverProfile.findById(driverId).populate(
      "userId",
      "name email phoneNumber",
    );

    if (!driver) {
      return res.status(404).json({
        message: "Driver not found.",
      });
    }

    // Get driver vehicles
    const vehicles = await DriverVehicle.find({
      driverId: driver._id,
      isActive: true,
    });

    res.status(200).json({
      success: true,
      driver: {
        id: driver._id,
        name: `${driver.firstName} ${driver.lastName}`,
        email: driver.userId.email,
        phone: driver.phone,
        profileImage: driver.profileImage || null,
        availabilityStatus: driver.isAvailable ? "available" : "offline",
        gender: driver.gender,
        dob: driver.dob,
        licenseVerified: driver.isVerified,
        nin: driver.nin,
        rating: 0, // TODO
        completedJobs: 0, // TODO
        joinDate: driver.createdAt,
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
        })),
      },
    });
  } catch (err) {
    console.error("Get driver details error:", err);
    res.status(500).json({
      message: "Failed to fetch driver details.",
      error: err.message,
    });
  }
};

/**
 * Assign Vehicle to Driver
 * POST /api/company/drivers/:driverId/assign-vehicle
 */
const assignVehicleToDriver = async (req, res) => {
  try {
    const userId = req.userId;
    const { driverId } = req.params;
    const { vehicleId, assignmentNotes } = req.body;

    if (!vehicleId) {
      return res.status(400).json({
        message: "Vehicle ID is required.",
      });
    }

    // Find company
    const companyProfile = await CompanyProfile.findOne({ userId });

    if (!companyProfile) {
      return res.status(404).json({
        message: "Company profile not found.",
      });
    }

    // Find driver
    const driver = await DriverProfile.findById(driverId);

    if (!driver) {
      return res.status(404).json({
        message: "Driver not found.",
      });
    }

    // Find vehicle and verify it belongs to company
    const vehicle = await Vehicle.findOne({
      _id: vehicleId,
      companyId: companyProfile._id,
    });

    if (!vehicle) {
      return res.status(404).json({
        message: "Vehicle not found or does not belong to your company.",
      });
    }

    // Check if vehicle is already assigned
    const existingAssignment = await VehicleAssignment.findOne({
      vehicleId,
      status: "active",
    });

    if (existingAssignment) {
      return res.status(400).json({
        message: "This vehicle is already assigned to another driver.",
      });
    }

    // Create assignment
    const assignment = await VehicleAssignment.create({
      companyId: companyProfile._id,
      driverId: driver._id,
      vehicleId: vehicle._id,
      status: "active",
      assignmentNotes: assignmentNotes || "",
      assignedBy: userId,
    });

    // Update vehicle status
    vehicle.isAssigned = true;
    vehicle.assignedDriverId = driver._id;
    await vehicle.save();

    // Update driver company reference
    if (!driver.companyId) {
      driver.companyId = companyProfile._id;
      await driver.save();

      // Increment company totalDrivers
      companyProfile.totalDrivers = (companyProfile.totalDrivers || 0) + 1;
      await companyProfile.save();
    }

    res.status(200).json({
      success: true,
      message: "Vehicle assigned to driver successfully",
      assignment: {
        driverId: driver._id,
        vehicleId: vehicle._id,
        vehicleName: vehicle.name,
        driverName: `${driver.firstName} ${driver.lastName}`,
        status: "active",
        assignedAt: assignment.assignedAt,
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
 * DELETE /api/company/drivers/:driverId/assign-vehicle/:vehicleId
 */
const unassignVehicleFromDriver = async (req, res) => {
  try {
    const userId = req.userId;
    const { driverId, vehicleId } = req.params;

    // Find company
    const companyProfile = await CompanyProfile.findOne({ userId });

    if (!companyProfile) {
      return res.status(404).json({
        message: "Company profile not found.",
      });
    }

    // Find assignment
    const assignment = await VehicleAssignment.findOne({
      companyId: companyProfile._id,
      driverId,
      vehicleId,
      status: "active",
    });

    if (!assignment) {
      return res.status(404).json({
        message: "Vehicle assignment not found.",
      });
    }

    // Update assignment
    assignment.status = "inactive";
    assignment.unassignedAt = new Date();
    await assignment.save();

    // Update vehicle
    const vehicle = await Vehicle.findById(vehicleId);
    if (vehicle) {
      vehicle.isAssigned = false;
      vehicle.assignedDriverId = null;
      await vehicle.save();
    }

    res.status(200).json({
      success: true,
      message: "Vehicle unassigned from driver",
    });
  } catch (err) {
    console.error("Unassign vehicle error:", err);
    res.status(500).json({
      message: "Failed to unassign vehicle.",
      error: err.message,
    });
  }
};

/**
 * Get Driver-Vehicle Assignments
 * GET /api/company/drivers/:driverId/assignments
 */
const getDriverAssignments = async (req, res) => {
  try {
    const userId = req.userId;
    const { driverId } = req.params;

    // Find company
    const companyProfile = await CompanyProfile.findOne({ userId });

    if (!companyProfile) {
      return res.status(404).json({
        message: "Company profile not found.",
      });
    }

    // Get assignments
    const assignments = await VehicleAssignment.find({
      companyId: companyProfile._id,
      driverId,
    })
      .populate("vehicleId")
      .sort({ assignedAt: -1 });

    res.status(200).json({
      success: true,
      assignments: assignments.map((a) => ({
        id: a._id,
        vehicleId: a.vehicleId._id,
        vehicleName: a.vehicleId.name,
        vehicleType: a.vehicleId.type,
        vehicleSubtype: a.vehicleId.model, // Using model as subtype for now
        plateNumber: a.vehicleId.plateNumber,
        status: a.status,
        assignedAt: a.assignedAt,
        notes: a.assignmentNotes,
      })),
    });
  } catch (err) {
    console.error("Get driver assignments error:", err);
    res.status(500).json({
      message: "Failed to fetch assignments.",
      error: err.message,
    });
  }
};

/**
 * Get Drivers by Vehicle Type
 * GET /api/company/drivers/filter/by-vehicle-type
 */
const getDriversByVehicleType = async (req, res) => {
  try {
    const { vehicleType, availability, page = 1 } = req.query;

    if (!vehicleType) {
      return res.status(400).json({
        message: "Vehicle type is required.",
      });
    }

    // Get drivers with matching vehicle type
    const vehicles = await DriverVehicle.find({
      vehicleType,
      isActive: true,
    });

    const driverIds = vehicles.map((v) => v.driverId);

    // Build driver query
    const query = { _id: { $in: driverIds } };

    if (availability === "available") {
      query.isAvailable = true;
    } else if (availability === "offline") {
      query.isAvailable = false;
    }

    // Get drivers
    const limit = 20;
    const skip = (parseInt(page) - 1) * limit;

    const drivers = await DriverProfile.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    // Format response
    const driversWithVehicles = await Promise.all(
      drivers.map(async (driver) => {
        const driverVehicles = await DriverVehicle.find({
          driverId: driver._id,
          vehicleType,
          isActive: true,
        });

        return {
          id: driver._id,
          name: `${driver.firstName} ${driver.lastName}`,
          availabilityStatus: driver.isAvailable ? "available" : "offline",
          vehicles: driverVehicles.map((v) => ({
            vehicleSubtype: v.vehicleSubtype,
            capacity: v.capacity,
          })),
        };
      }),
    );

    res.status(200).json({
      success: true,
      vehicleType,
      count: driversWithVehicles.length,
      drivers: driversWithVehicles,
    });
  } catch (err) {
    console.error("Get drivers by vehicle type error:", err);
    res.status(500).json({
      message: "Failed to fetch drivers.",
      error: err.message,
    });
  }
};

/**
 * Get Available Drivers
 * GET /api/company/drivers/available
 */
const getAvailableDrivers = async (req, res) => {
  try {
    const { vehicleType, page = 1 } = req.query;

    // Build query
    const query = { isAvailable: true };

    const limit = 20;
    const skip = (parseInt(page) - 1) * limit;

    const drivers = await DriverProfile.find(query)
      .populate("userId", "email")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    // Get vehicles for each driver
    let driversWithVehicles = await Promise.all(
      drivers.map(async (driver) => {
        const vehicles = await DriverVehicle.find({
          driverId: driver._id,
          isActive: true,
        });

        const firstVehicle = vehicles[0];

        return {
          id: driver._id,
          name: `${driver.firstName} ${driver.lastName}`,
          email: driver.userId.email,
          availabilityStatus: "available",
          vehicle: firstVehicle
            ? {
                vehicleType: firstVehicle.vehicleType,
                vehicleSubtype: firstVehicle.vehicleSubtype,
              }
            : null,
        };
      }),
    );

    // Filter by vehicle type if provided
    if (vehicleType) {
      driversWithVehicles = driversWithVehicles.filter(
        (d) => d.vehicle && d.vehicle.vehicleType === vehicleType,
      );
    }

    res.status(200).json({
      success: true,
      availableCount: driversWithVehicles.length,
      drivers: driversWithVehicles,
    });
  } catch (err) {
    console.error("Get available drivers error:", err);
    res.status(500).json({
      message: "Failed to fetch available drivers.",
      error: err.message,
    });
  }
};

/**
 * Get Unverified Drivers
 * GET /api/company/drivers/unverified
 */
const getUnverifiedDrivers = async (req, res) => {
  try {
    const drivers = await DriverProfile.find({ isVerified: false })
      .populate("userId", "email")
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      unverifiedCount: drivers.length,
      drivers: drivers.map((d) => ({
        id: d._id,
        name: `${d.firstName} ${d.lastName}`,
        email: d.userId.email,
        joinDate: d.createdAt,
        licenseVerificationStatus: "pending",
      })),
    });
  } catch (err) {
    console.error("Get unverified drivers error:", err);
    res.status(500).json({
      message: "Failed to fetch unverified drivers.",
      error: err.message,
    });
  }
};

module.exports = {
  getAllDrivers,
  getDriverDetails,
  assignVehicleToDriver,
  unassignVehicleFromDriver,
  getDriverAssignments,
  getDriversByVehicleType,
  getAvailableDrivers,
  getUnverifiedDrivers,
};
