// routes/api/driverVehicle.js
const express = require("express");
const router = express.Router();
const driverVehicleController = require("../../controllers/driverVehicleController");
const verifyRoles = require("../../middleware/verifyRoles");
const { ROLES_LIST } = require("../../config/roles_list");

// All routes require JWT and Driver role (applied in server.js)

// Driver Profile
router.get("/profile", driverVehicleController.getDriverProfile);

// Driver Vehicles
router.post("/vehicles", driverVehicleController.addDriverVehicle);
router.get("/vehicles", driverVehicleController.getDriverVehicles);
router.put("/vehicles/:vehicleId", driverVehicleController.updateDriverVehicle);
router.delete(
  "/vehicles/:vehicleId",
  driverVehicleController.deleteDriverVehicle,
);

// Driver Availability
router.put("/availability", driverVehicleController.updateDriverAvailability);
router.get("/availability", driverVehicleController.getDriverAvailability);

module.exports = router;
