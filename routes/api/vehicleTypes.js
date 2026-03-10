const express = require("express");
const router = express.Router();
const vehicleTypesController = require("../../controllers/vehicleTypesController");

// Public route - no authentication required
router.get("/", vehicleTypesController.getVehicleTypes);

module.exports = router;
