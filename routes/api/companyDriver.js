// routes/api/companyDriver.js
const express = require("express");
const router = express.Router();
const companyDriverController = require("../../controllers/companyDriverController");
const verifyRoles = require("../../middleware/verifyRoles");
const { ROLES_LIST } = require("../../config/roles_list");

// All routes require JWT and Company role (applied in server.js)

// Get all drivers
router.get("/", companyDriverController.getAllDrivers);

// Get available drivers (must come before /:driverId)
router.get("/available", companyDriverController.getAvailableDrivers);

// Get unverified drivers (must come before /:driverId)
router.get("/unverified", companyDriverController.getUnverifiedDrivers);

// Get drivers by vehicle type (must come before /:driverId)
router.get(
  "/filter/by-vehicle-type",
  companyDriverController.getDriversByVehicleType,
);

// Get single driver details
router.get("/:driverId", companyDriverController.getDriverDetails);

// Vehicle assignment
router.post(
  "/:driverId/assign-vehicle",
  companyDriverController.assignVehicleToDriver,
);
router.delete(
  "/:driverId/assign-vehicle/:vehicleId",
  companyDriverController.unassignVehicleFromDriver,
);

// Get driver assignments
router.get(
  "/:driverId/assignments",
  companyDriverController.getDriverAssignments,
);

module.exports = router;
