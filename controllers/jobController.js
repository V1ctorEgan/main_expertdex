const Booking = require("../model/Booking");
const DriverProfile = require("../model/DriverProfile");
const Vehicle = require("../model/Vehicles");

/**
 * Get Available Jobs for Driver
 * GET /provider/jobs?status=available
 */
const getAvailableJobs = async (req, res) => {
  try {
    const userId = req.userId;

    // Get driver profile
    const driverProfile = await DriverProfile.findOne({ userId });
    if (!driverProfile) {
      return res.status(404).json({
        message: "Driver profile not found.",
      });
    }

    // Check if driver is available/online
    if (!driverProfile.isAvailable) {
      return res.status(400).json({
        message: "You must be online to view available jobs.",
      });
    }

    // Get driver's vehicle type (if they have one)
    let vehicleType = null;
    if (driverProfile.assignedVehicleId) {
      const vehicle = await Vehicle.findById(driverProfile.assignedVehicleId);
      if (vehicle) {
        vehicleType = vehicle.type;
      }
    } else if (
      driverProfile.ownCar === "yes" &&
      driverProfile.vehicle.vehicleName
    ) {
      // Determine vehicle type from driver's own vehicle (simplified)
      vehicleType = "van"; // Default, you can add logic to map vehicle name to type
    }

    // Build query for available jobs
    const query = {
      status: "pending",
      driverId: null, // Not yet assigned
    };

    // If driver has a specific vehicle type, filter by that
    if (vehicleType) {
      query.vehicleType = vehicleType;
    }

    const availableJobs = await Booking.find(query)
      .populate("userId", "name email phoneNumber")
      .sort({ createdAt: -1 })
      .limit(50)
      .exec();

    res.status(200).json({
      success: true,
      count: availableJobs.length,
      data: availableJobs,
    });
  } catch (err) {
    console.error("Get available jobs error:", err);
    res.status(500).json({
      message: "Failed to fetch available jobs.",
      error: err.message,
    });
  }
};

/**
 * Get Driver's Active Jobs
 * GET /provider/jobs?status=active
 */
const getActiveJobs = async (req, res) => {
  try {
    const userId = req.userId;

    const driverProfile = await DriverProfile.findOne({ userId });
    if (!driverProfile) {
      return res.status(404).json({
        message: "Driver profile not found.",
      });
    }

    const activeJobs = await Booking.find({
      driverId: driverProfile._id,
      status: { $in: ["accepted", "in_progress"] },
    })
      .populate("userId", "name email phoneNumber")
      .sort({ acceptedDate: -1 })
      .exec();

    res.status(200).json({
      success: true,
      count: activeJobs.length,
      data: activeJobs,
    });
  } catch (err) {
    console.error("Get active jobs error:", err);
    res.status(500).json({
      message: "Failed to fetch active jobs.",
      error: err.message,
    });
  }
};

/**
 * Get Driver's Completed Jobs
 * GET /provider/jobs?status=completed
 */
const getCompletedJobs = async (req, res) => {
  try {
    const userId = req.userId;

    const driverProfile = await DriverProfile.findOne({ userId });
    if (!driverProfile) {
      return res.status(404).json({
        message: "Driver profile not found.",
      });
    }

    const completedJobs = await Booking.find({
      driverId: driverProfile._id,
      status: "completed",
    })
      .populate("userId", "name email phoneNumber")
      .sort({ completedDate: -1 })
      .limit(100)
      .exec();

    res.status(200).json({
      success: true,
      count: completedJobs.length,
      data: completedJobs,
    });
  } catch (err) {
    console.error("Get completed jobs error:", err);
    res.status(500).json({
      message: "Failed to fetch completed jobs.",
      error: err.message,
    });
  }
};

/**
 * Accept a Job
 * POST /provider/jobs/:jobId/accept
 */
const acceptJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.userId;

    // Get driver profile
    const driverProfile = await DriverProfile.findOne({ userId });
    if (!driverProfile) {
      return res.status(404).json({
        message: "Driver profile not found.",
      });
    }

    // Check if driver is available
    if (!driverProfile.isAvailable) {
      return res.status(400).json({
        message: "You must be online to accept jobs.",
      });
    }

    // Find the booking
    const booking = await Booking.findById(jobId);
    if (!booking) {
      return res.status(404).json({
        message: "Job not found.",
      });
    }

    // Check if job is still available
    if (booking.status !== "pending") {
      return res.status(400).json({
        message: "This job is no longer available.",
      });
    }

    if (booking.driverId) {
      return res.status(400).json({
        message: "This job has already been accepted by another driver.",
      });
    }

    // Check if driver already has an active job
    const activeJobCount = await Booking.countDocuments({
      driverId: driverProfile._id,
      status: { $in: ["accepted", "in_progress"] },
    });

    if (activeJobCount > 0) {
      return res.status(400).json({
        message:
          "You already have an active job. Complete it before accepting a new one.",
      });
    }

    // Accept the job
    booking.driverId = driverProfile._id;
    booking.status = "accepted";
    booking.acceptedDate = new Date();
    await booking.save();

    const updatedBooking = await Booking.findById(jobId)
      .populate("userId", "name email phoneNumber")
      .populate("driverId", "firstName lastName phone")
      .exec();

    res.status(200).json({
      success: true,
      message: "Job accepted successfully!",
      data: updatedBooking,
    });
  } catch (err) {
    console.error("Accept job error:", err);
    res.status(500).json({
      message: "Failed to accept job.",
      error: err.message,
    });
  }
};

/**
 * Start a Job (Move to in_progress)
 * POST /provider/jobs/:jobId/start
 */
const startJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.userId;

    const driverProfile = await DriverProfile.findOne({ userId });
    if (!driverProfile) {
      return res.status(404).json({
        message: "Driver profile not found.",
      });
    }

    const booking = await Booking.findById(jobId);
    if (!booking) {
      return res.status(404).json({
        message: "Job not found.",
      });
    }

    // Verify driver owns this job
    if (!booking.driverId || !booking.driverId.equals(driverProfile._id)) {
      return res.status(403).json({
        message: "This job is not assigned to you.",
      });
    }

    if (booking.status !== "accepted") {
      return res.status(400).json({
        message: "Job must be in 'accepted' status to start.",
      });
    }

    // Start the job
    booking.status = "in_progress";
    booking.startedDate = new Date();
    await booking.save();

    res.status(200).json({
      success: true,
      message: "Job started successfully!",
      data: booking,
    });
  } catch (err) {
    console.error("Start job error:", err);
    res.status(500).json({
      message: "Failed to start job.",
      error: err.message,
    });
  }
};

/**
 * Complete a Job
 * POST /provider/jobs/:jobId/complete
 */
const completeJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.userId;
    const { actualPrice } = req.body; // Optional: override estimated price

    const driverProfile = await DriverProfile.findOne({ userId });
    if (!driverProfile) {
      return res.status(404).json({
        message: "Driver profile not found.",
      });
    }

    const booking = await Booking.findById(jobId);
    if (!booking) {
      return res.status(404).json({
        message: "Job not found.",
      });
    }

    // Verify driver owns this job
    if (!booking.driverId || !booking.driverId.equals(driverProfile._id)) {
      return res.status(403).json({
        message: "This job is not assigned to you.",
      });
    }

    if (booking.status !== "in_progress") {
      return res.status(400).json({
        message: "Job must be in 'in_progress' status to complete.",
      });
    }

    // Complete the job
    booking.status = "completed";
    booking.completedDate = new Date();
    booking.actualPrice = actualPrice || booking.estimatedPrice;
    await booking.save();

    // Update vehicle stats if assigned
    if (driverProfile.assignedVehicleId) {
      await Vehicle.findByIdAndUpdate(driverProfile.assignedVehicleId, {
        $inc: {
          totalTrips: 1,
          totalRevenue: booking.actualPrice,
        },
      });
    }

    res.status(200).json({
      success: true,
      message: "Job completed successfully!",
      data: booking,
    });
  } catch (err) {
    console.error("Complete job error:", err);
    res.status(500).json({
      message: "Failed to complete job.",
      error: err.message,
    });
  }
};

/**
 * Get Driver Earnings
 * GET /provider/earnings
 */
const getEarnings = async (req, res) => {
  try {
    const userId = req.userId;
    const { period } = req.query; // today, week, month, all

    const driverProfile = await DriverProfile.findOne({ userId });
    if (!driverProfile) {
      return res.status(404).json({
        message: "Driver profile not found.",
      });
    }

    // Build date filter
    let dateFilter = {};
    const now = new Date();

    if (period === "today") {
      const startOfDay = new Date(now.setHours(0, 0, 0, 0));
      dateFilter = { completedDate: { $gte: startOfDay } };
    } else if (period === "week") {
      const startOfWeek = new Date(now.setDate(now.getDate() - 7));
      dateFilter = { completedDate: { $gte: startOfWeek } };
    } else if (period === "month") {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      dateFilter = { completedDate: { $gte: startOfMonth } };
    }

    // Get completed jobs
    const completedJobs = await Booking.find({
      driverId: driverProfile._id,
      status: "completed",
      ...dateFilter,
    });

    const totalEarnings = completedJobs.reduce(
      (sum, job) => sum + (job.actualPrice || 0),
      0,
    );
    const totalTrips = completedJobs.length;

    res.status(200).json({
      success: true,
      data: {
        period: period || "all",
        totalEarnings,
        totalTrips,
        averagePerTrip: totalTrips > 0 ? totalEarnings / totalTrips : 0,
        jobs: completedJobs,
      },
    });
  } catch (err) {
    console.error("Get earnings error:", err);
    res.status(500).json({
      message: "Failed to fetch earnings.",
      error: err.message,
    });
  }
};

/**
 * Set Driver Online/Offline Status
 * POST /provider/status
 */
const setDriverStatus = async (req, res) => {
  try {
    const userId = req.userId;
    const { isAvailable } = req.body;

    if (typeof isAvailable !== "boolean") {
      return res.status(400).json({
        message: "isAvailable must be a boolean value (true or false).",
      });
    }

    const driverProfile = await DriverProfile.findOneAndUpdate(
      { userId },
      { isAvailable },
      { new: true },
    );

    if (!driverProfile) {
      return res.status(404).json({
        message: "Driver profile not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: `You are now ${isAvailable ? "online" : "offline"}.`,
      data: {
        isAvailable: driverProfile.isAvailable,
      },
    });
  } catch (err) {
    console.error("Set driver status error:", err);
    res.status(500).json({
      message: "Failed to update status.",
      error: err.message,
    });
  }
};

module.exports = {
  getAvailableJobs,
  getActiveJobs,
  getCompletedJobs,
  acceptJob,
  startJob,
  completeJob,
  getEarnings,
  setDriverStatus,
};
