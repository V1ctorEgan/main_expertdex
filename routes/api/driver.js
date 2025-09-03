// routes/api/driverProfiles.js
const express = require('express');
const router = express.Router();
const driverProfileController = require('../../controllers/driverController');
const verifyRoles = require('../../middleware/verifyRoles');
const verifyJWT = require('../../middleware/verifyJWT')
const ROLES_LIST = require('../../config/roles_list');

router.route('/')
    .get(driverProfileController.getAllDrivers)
    .post(verifyRoles([ROLES_LIST.Admin, ROLES_LIST.Company, ROLES_LIST.Driver]),driverProfileController.createNewDriverProfile)
    

router.route('/:id')
    .get(driverProfileController.getDriverProfile)
    .put(verifyRoles([ROLES_LIST.Admin, ROLES_LIST.Company]), driverProfileController.assignVehicleToDriver)
    .delete(verifyRoles([ROLES_LIST.Admin, ROLES_LIST.Driver]), driverProfileController.deleteDriverProfile);