const express = require('express');
const router = express.Router();
const vehicleController = require("../../controllers/vehicleController")
const {ROLES_LIST} = require('../../config/roles_list');
const verifyRoles = require('../../middleware/verifyRoles');

router.route('/')
    .get(vehicleController.getAllVehicles)
    .post(verifyRoles([ROLES_LIST.Admin, ROLES_LIST.Driver, ROLES_LIST.Company]), vehicleController.createNewVehicle)
    // .put(verifyRoles([ROLES_LIST.Admin, ROLES_LIST.Driver, ROLES_LIST.Company]), vehicleController.updateVehicle)
    // .delete(verifyRoles([ROLES_LIST.Admin, ROLES_LIST.Driver, ROLES_LIST.Company]), vehicleController.deleteVehicle);

router.route('/:id')
    .get(vehicleController.getVehicle)
    .put(verifyRoles([ROLES_LIST.Admin, ROLES_LIST.Driver,ROLES_LIST.Company]), vehicleController.updateVehicle)
    .patch(verifyRoles([ROLES_LIST.Admin, ROLES_LIST.Driver,ROLES_LIST.Company]), vehicleController.patchVehicle)
    .delete(verifyRoles([ROLES_LIST.Admin, ROLES_LIST.Driver, ROLES_LIST.Company]), vehicleController.deleteVehicle)
module.exports = router;