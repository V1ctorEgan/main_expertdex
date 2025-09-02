const express = require('express');
const router = express.Router();
const companyController = require("../../controllers/companyController")
const {ROLES_LIST} = require('../../config/roles_list');
const verifyRoles = require('../../middleware/verifyRoles');

router.route('/')
    .get(companyController.getAllCompanies)
    .post(verifyRoles([ROLES_LIST.Admin, ROLES_LIST.Company]), companyController.createNewCompanies)
    .put(verifyRoles([ROLES_LIST.Admin, ROLES_LIST.Company]), companyController.updateCompany)
    .delete(verifyRoles([ROLES_LIST.Admin, ROLES_LIST.Company]), companyController.deleteCompany);

router.route('/:id')
    .get(companyController.getCompany)
    .put(verifyRoles([ROLES_LIST.Admin, ROLES_LIST.Company]), companyController.updateCompany)
    .delete(verifyRoles([ROLES_LIST.Admin, ROLES_LIST.Company]), companyController.deleteCompany)

console.log("Loading company routes...");
module.exports = router;