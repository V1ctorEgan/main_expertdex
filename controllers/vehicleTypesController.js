const { VEHICLE_TYPES } = require("../config/vehicleTypes");

/**
 * Get Vehicle Types and Subtypes
 * GET /api/vehicle-types
 */
const getVehicleTypes = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      vehicleTypes: VEHICLE_TYPES,
    });
  } catch (err) {
    console.error("Get vehicle types error:", err);
    res.status(500).json({
      message: "Failed to fetch vehicle types.",
      error: err.message,
    });
  }
};

module.exports = {
  getVehicleTypes,
};
