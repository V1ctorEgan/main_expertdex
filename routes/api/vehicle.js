// routes/api/vehicle.js
const express = require("express");
const router = express.Router();
const vehicleController = require("../../controllers/vehiclesController");
// const verifyRoles = require("../../middleware/verifyRoles");
const verifyRoles = require("../../middleware/verifyRoles");
const { ROLES_LIST } = require("../../config/roles_list");

// All routes require JWT (applied in server.js via verifyJWT middleware)

// Company vehicle management
router
  .route("/")
  .get(
    verifyRoles([ROLES_LIST.Admin, ROLES_LIST.Company]),
    vehicleController.getCompanyVehicles,
  )
  .post(
    verifyRoles([ROLES_LIST.Admin, ROLES_LIST.Company]),
    vehicleController.addVehicle,
  );

router
  .route("/:id")
  .get(
    verifyRoles([ROLES_LIST.Admin, ROLES_LIST.Company]),
    vehicleController.getVehicle,
  )
  .put(
    verifyRoles([ROLES_LIST.Admin, ROLES_LIST.Company]),
    vehicleController.updateVehicle,
  )
  .delete(
    verifyRoles([ROLES_LIST.Admin, ROLES_LIST.Company]),
    vehicleController.deleteVehicle,
  );

// Vehicle assignment
router.put(
  "/:vehicleId/assign/:driverId",
  verifyRoles([ROLES_LIST.Admin, ROLES_LIST.Company]),
  vehicleController.assignVehicleToDriver,
);

router.put(
  "/:vehicleId/unassign",
  verifyRoles([ROLES_LIST.Admin, ROLES_LIST.Company]),
  vehicleController.unassignVehicle,
);

module.exports = router;
