// routes/api/driverProfiles.js
const express = require("express");
const router = express.Router();
const driverProfileController = require("../../controllers/driversController");
const verifyRoles = require("../../middleware/verifyRoles");
// const verifyJWT = require("../../middleware/verifyJWT");
const { ROLES_LIST } = require("../../config/roles_list");

router
  .route("/")
  .get(driverProfileController.getAllDrivers)
  .post(
    driverProfileController.handleDriverOnboarding,
  );

router
  .route("/:id")
  .get(driverProfileController.getDriverProfile)
  .put(
    verifyRoles([ROLES_LIST.Admin, ROLES_LIST.Company, ROLES_LIST.Driver]),
    driverProfileController.updateDriverProfile,
  );
// .delete(
//   verifyRoles([ROLES_LIST.Admin, ROLES_LIST.Driver]),
//   driverProfileController.deleteDriverProfile,
// );

// router
//   .route("/assign/:id")
//   .put(
//     verifyRoles([ROLES_LIST.Admin, ROLES_LIST.Company, ROLES_LIST.Driver]),
//     driverProfileController.assignVehicleToDriver,
//   );
console.log("Loading Drivers routes ...");

module.exports = router;
