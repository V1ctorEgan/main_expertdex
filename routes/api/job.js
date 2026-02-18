// routes/api/job.js (or provider.js)
const express = require("express");
const router = express.Router();
const jobController = require("../../controllers/jobController");
const verifyRoles = require("../../middleware/verifyRoles");
const { ROLES_LIST } = require("../../config/roles_list");

// All routes require JWT (applied in server.js)
// All routes are for drivers only

// Get jobs based on status query parameter
router.get("/jobs", verifyRoles([ROLES_LIST.Driver]), (req, res, next) => {
  const { status } = req.query;

  if (status === "available") {
    return jobController.getAvailableJobs(req, res);
  } else if (status === "active") {
    return jobController.getActiveJobs(req, res);
  } else if (status === "completed") {
    return jobController.getCompletedJobs(req, res);
  } else {
    // Default: get active jobs
    return jobController.getActiveJobs(req, res);
  }
});

// Accept a job
router.post(
  "/jobs/:jobId/accept",
  verifyRoles([ROLES_LIST.Driver]),
  jobController.acceptJob,
);

// Start a job
router.post(
  "/jobs/:jobId/start",
  verifyRoles([ROLES_LIST.Driver]),
  jobController.startJob,
);

// Complete a job
router.post(
  "/jobs/:jobId/complete",
  verifyRoles([ROLES_LIST.Driver]),
  jobController.completeJob,
);

// Get earnings
router.get(
  "/earnings",
  verifyRoles([ROLES_LIST.Driver]),
  jobController.getEarnings,
);

// Set online/offline status
router.post(
  "/status",
  verifyRoles([ROLES_LIST.Driver]),
  jobController.setDriverStatus,
);

module.exports = router;
