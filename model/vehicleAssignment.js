const mongoose = require("mongoose");

const vehicleAssignmentSchema = new mongoose.Schema(
  {
    // Company reference
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CompanyProfiles",
      required: true,
    },

    // Driver reference
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DriverProfiles",
      required: true,
    },

    // Vehicle reference
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicles",
      required: true,
    },

    // Assignment details
    status: {
      type: String,
      enum: ["active", "inactive", "pending"],
      default: "active",
    },

    assignmentNotes: {
      type: String,
      default: "",
    },

    assignedAt: {
      type: Date,
      default: Date.now,
    },

    unassignedAt: {
      type: Date,
      default: null,
    },

    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
vehicleAssignmentSchema.index({ companyId: 1 });
vehicleAssignmentSchema.index({ driverId: 1 });
vehicleAssignmentSchema.index({ vehicleId: 1 });
vehicleAssignmentSchema.index({ status: 1 });

// Ensure one active assignment per vehicle
vehicleAssignmentSchema.index(
  { vehicleId: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "active" },
  },
);

module.exports = mongoose.model("VehicleAssignments", vehicleAssignmentSchema);
