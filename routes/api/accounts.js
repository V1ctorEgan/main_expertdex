const express = require('express');
const router = express.Router();
const accountsController = require('../../controllers/accountsController');
const {ROLES_LIST} = require('../../config/roles_list');
const verifyRoles = require('../../middleware/verifyRoles');

router.route('/')
    .get(accountsController.getAllEmployees)
    .post(verifyRoles([ROLES_LIST.Admin, ROLES_LIST.Company]), accountsController.createNewEmployee)
    .put(verifyRoles([ROLES_LIST.Admin, ROLES_LIST.Company]), accountsController.updateEmployee)
    .delete(verifyRoles([ROLES_LIST.Admin]), accountsController.deleteEmployee);

router.route('/:id')
    .get(accountsController.getEmployee);

console.log("Loading accounts routes...");

module.exports = router;