const express = require("express");
const router = express.Router();
const companyController = require("../../controllers/CompanysController");
const { ROLES_LIST } = require("../../config/roles_list");
const verifyRoles = require("../../middleware/verifyRoles");

router
  .route("/")
  .get(companyController.getAllCompanies)
  .post(companyController.handleCompanyOnboarding);
//   .delete(
//     verifyRoles([ROLES_LIST.Admin, ROLES_LIST.Company]),
//     companyController.deleteCompany,
//   );

router
  .route("/:id")
  .get(companyController.getCompanyProfile)
  .put(
    verifyRoles([ROLES_LIST.Admin, ROLES_LIST.Company]),
    companyController.updateCompanyProfile,
  );

router
  .route("/:id/drivers")
  .get(
    verifyRoles([ROLES_LIST.Admin, ROLES_LIST.Company]),
    companyController.getCompanyDrivers,
  );

//   .delete(
//     verifyRoles([ROLES_LIST.Admin, ROLES_LIST.Company]),
//     companyController.deleteCompany,
//   );

console.log("Loading company routes...");
module.exports = router;
