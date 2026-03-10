const User = require("../model/Users");
const DriverProfile = require("../model/DriverProfile");
const bcrypt = require("bcryptjs");

/**
 * Complete Driver Onboarding
 * This endpoint handles the full driver registration:
 * 1. Creates a User account (for authentication)
 * 2. Creates a DriverProfile (for driver-specific data)
 */
const getAllDrivers = async (req, res) => {
  const drivers = await DriverProfile.find();
  if (!drivers) return res.status(204).json({ message: "no driver found" });
  console.log(drivers);
  res.json(drivers);
};
// const handleDriverOnboarding = async (req, res) => {
//   console.log("Incoming driver onboarding req.body:", req.body);

//   const {
//     // User account fields
//     email,
//     pwd,

//     // Driver profile fields
//     firstName,
//     lastName,
//     profileImage,
//     bio,
//     phone,
//     dob,
//     gender,
//     ownCar,

//     // Vehicle fields (optional, only if ownCar === "yes")
//     vehicleName,
//     vehicleModel,
//     vehicleColor,

//     // License & Registration
//     licenseImage,
//     nin,
//   } = req.body;

//   // Validation: Required fields
//   if (!email || !pwd) {
//     return res.status(400).json({
//       message: "Email and password are required.",
//     });
//   }

//   if (!firstName || !lastName || !phone || !dob || !gender || !ownCar) {
//     return res.status(400).json({
//       message: "All personal information fields are required.",
//     });
//   }

//   if (!licenseImage || !nin) {
//     return res.status(400).json({
//       message: "License image and NIN are required.",
//     });
//   }

//   // Validation: If driver owns a car, vehicle details are required
//   if (ownCar === "yes" && (!vehicleName || !vehicleModel || !vehicleColor)) {
//     return res.status(400).json({
//       message: "Vehicle details are required if you own a car.",
//     });
//   }

//   try {
//     // Check for duplicate email in Users collection
//     const existingUser = await User.findOne({ email }).exec();
//     if (existingUser) {
//       return res.status(409).json({
//         message: "Email already registered.",
//       });
//     }

//     // Hash the password
//     const hashedPwd = await bcrypt.hash(pwd, 10);

//     // Create User account
//     const newUser = await User.create({
//       name: `${firstName} ${lastName}`,
//       email: email,
//       password: hashedPwd,
//       accountType: "driver",
//       phoneNumber: phone,
//     });

//     console.log("User created:", newUser);

//     // Prepare vehicle data (only if ownCar === "yes")
//     const vehicleData =
//       ownCar === "yes"
//         ? {
//             vehicleName: vehicleName || "",
//             vehicleModel: vehicleModel || "",
//             vehicleColor: vehicleColor || "",
//           }
//         : {
//             vehicleName: "",
//             vehicleModel: "",
//             vehicleColor: "",
//           };

//     // Create Driver Profile
//     const driverProfile = await DriverProfile.create({
//       userId: newUser._id,
//       firstName,
//       lastName,
//       profileImage: profileImage || null,
//       bio: bio || "",
//       phone,
//       dob,
//       gender,
//       ownCar,
//       vehicle: vehicleData,
//       licenseImage,
//       nin,
//       isAvailable: true,
//       isVerified: false, // Admin needs to verify
//       isApproved: false, // Admin needs to approve
//     });

//     console.log("Driver profile created:", driverProfile);

//     res.status(201).json({
//       success: true,
//       message: "Driver registration successful!",
//       data: {
//         userId: newUser._id,
//         email: newUser.email,
//         accountType: newUser.accountType,
//         driverProfileId: driverProfile._id,
//         firstName: driverProfile.firstName,
//         lastName: driverProfile.lastName,
//       },
//     });
//   } catch (err) {
//     console.error("Driver onboarding error:", err);

//     // If driver profile creation fails but user was created, we should clean up
//     // (This is a basic approach; in production, use transactions)
//     res.status(500).json({
//       message: "Registration failed. Please try again.",
//       error: err.message,
//     });
//   }
// };

const handleDriverOnboarding = async (req, res) => {
  console.log("=== DRIVER ONBOARDING STARTED ===");
  console.log("Request body:", JSON.stringify(req.body, null, 2));

  const {
    email,
    pwd,
    firstName,
    lastName,
    profileImage,
    bio,
    phone,
    dob,
    gender,
    ownCar,
    vehicleName,
    vehicleModel,
    vehicleColor,
    licenseImage,
    nin,
  } = req.body;

  // Validation
  if (!email || !pwd) {
    console.log("❌ Validation failed: Missing email or password");
    return res.status(400).json({
      message: "Email and password are required.",
    });
  }

  if (!firstName || !lastName || !phone || !dob || !gender || !ownCar) {
    console.log("❌ Validation failed: Missing personal info");
    return res.status(400).json({
      message: "All personal information fields are required.",
    });
  }

  if (!licenseImage || !nin) {
    console.log("❌ Validation failed: Missing license or NIN");
    return res.status(400).json({
      message: "License image and NIN are required.",
    });
  }

  if (ownCar === "yes" && (!vehicleName || !vehicleModel || !vehicleColor)) {
    console.log("❌ Validation failed: Missing vehicle details");
    return res.status(400).json({
      message: "Vehicle details are required if you own a car.",
    });
  }

  console.log("✅ All validations passed");

  try {
    // Check for duplicate
    console.log(`Checking for existing user: ${email}`);
    const existingUser = await User.findOne({ email }).exec();

    if (existingUser) {
      console.log("❌ User already exists:", existingUser._id);
      return res.status(409).json({
        message: "Email already registered.",
      });
    }

    console.log("✅ Email is available");

    // Hash password
    console.log("Hashing password...");
    const hashedPwd = await bcrypt.hash(pwd, 10);
    console.log(`✅ Password hashed (${hashedPwd.length} chars)`);

    // Create User - WITH DETAILED ERROR HANDLING
    console.log("Creating User account...");
    let newUser;

    try {
      newUser = await User.create({
        name: `${firstName} ${lastName}`,
        email: email.toLowerCase().trim(),
        password: hashedPwd,
        accountType: "driver",
        phoneNumber: phone,
      });

      console.log("✅ User created successfully:");
      console.log(
        JSON.stringify(
          {
            _id: newUser._id,
            email: newUser.email,
            accountType: newUser.accountType,
            phoneNumber: newUser.phoneNumber,
          },
          null,
          2,
        ),
      );
    } catch (userCreateError) {
      console.error("❌ FAILED TO CREATE USER!");
      console.error("Error name:", userCreateError.name);
      console.error("Error message:", userCreateError.message);
      console.error("Error code:", userCreateError.code);
      console.error("Full error:", userCreateError);

      // Return specific error
      return res.status(500).json({
        message: "Failed to create user account.",
        error: userCreateError.message,
        details: userCreateError.code
          ? `Error code: ${userCreateError.code}`
          : null,
      });
    }

    // Prepare vehicle data
    const vehicleData =
      ownCar === "yes"
        ? {
            vehicleName: vehicleName || "",
            vehicleModel: vehicleModel || "",
            vehicleColor: vehicleColor || "",
          }
        : {
            vehicleName: "",
            vehicleModel: "",
            vehicleColor: "",
          };

    // Create Driver Profile
    console.log("Creating Driver Profile...");
    let driverProfile;

    try {
      driverProfile = await DriverProfile.create({
        userId: newUser._id,
        firstName,
        lastName,
        profileImage: profileImage || null,
        bio: bio || "",
        phone,
        dob,
        gender,
        ownCar,
        vehicle: vehicleData,
        licenseImage,
        nin,
        isAvailable: true,
        isVerified: false,
        isApproved: false,
      });

      console.log("✅ Driver profile created successfully:");
      console.log(
        JSON.stringify(
          {
            _id: driverProfile._id,
            userId: driverProfile.userId,
            firstName: driverProfile.firstName,
            lastName: driverProfile.lastName,
          },
          null,
          2,
        ),
      );
    } catch (profileCreateError) {
      console.error("❌ FAILED TO CREATE DRIVER PROFILE!");
      console.error("Error:", profileCreateError);

      // Clean up: Delete the user we just created
      console.log("Rolling back: Deleting user account...");
      await User.findByIdAndDelete(newUser._id);
      console.log("✅ User account deleted (rollback successful)");

      return res.status(500).json({
        message: "Failed to create driver profile.",
        error: profileCreateError.message,
      });
    }

    console.log("=== DRIVER ONBOARDING SUCCESSFUL ===");

    res.status(201).json({
      success: true,
      message: "Driver registration successful!",
      data: {
        userId: newUser._id,
        email: newUser.email,
        accountType: newUser.accountType,
        driverProfileId: driverProfile._id,
        firstName: driverProfile.firstName,
        lastName: driverProfile.lastName,
      },
    });
  } catch (err) {
    console.error("❌ UNEXPECTED ERROR IN DRIVER ONBOARDING:");
    console.error("Error name:", err.name);
    console.error("Error message:", err.message);
    console.error("Stack trace:", err.stack);

    res.status(500).json({
      message: "Registration failed. Please try again.",
      error: err.message,
    });
  }
};
/**
 * Get Driver Profile by User ID
 */
const getDriverProfile = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("🔍 Searching for driver with ID:", id);

    let driverProfile = await DriverProfile.findById(id)
      .populate("userId", "email accountType isVerified")
      .populate("companyId", "enterpriseName contactEmail")
      .exec();
    console.log("📝 Found by userId:", driverProfile ? "Yes" : "No");

    if (!driverProfile) {
      console.log("🔍 Trying to find by userId...");
      driverProfile = await DriverProfile.findOne({ userId: id })
        .populate("userId", "email accountType isVerified")
        .populate("companyId", "enterpriseName contactEmail")
        .exec();

      console.log("📝 Found by userId:", driverProfile ? "Yes" : "No");
    }

    if (!driverProfile) {
      console.log("❌ Driver profile not found for ID:", id);
      return res.status(404).json({
        message: "Driver profile not found.",
      });
    }
    console.log("✅ Driver profile found!");
    res.status(200).json({
      success: true,
      data: driverProfile,
    });
  } catch (err) {
    console.error("Get driver profile error:", err);
    res.status(500).json({
      message: "Failed to fetch driver profile.",
      error: err.message,
    });
  }
};

/**
 * Update Driver Profile
 */
const updateDriverProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;

    // Prevent updating sensitive fields
    delete updateData.userId;
    delete updateData.isVerified;
    delete updateData.isApproved;

    const updatedProfile = await DriverProfile.findOneAndUpdate(
      { userId },
      updateData,
      { new: true, runValidators: true },
    );

    if (!updatedProfile) {
      return res.status(404).json({
        message: "Driver profile not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Driver profile updated successfully.",
      data: updatedProfile,
    });
  } catch (err) {
    console.error("Update driver profile error:", err);
    res.status(500).json({
      message: "Failed to update driver profile.",
      error: err.message,
    });
  }
};

module.exports = {
  handleDriverOnboarding,
  getDriverProfile,
  updateDriverProfile,
  getAllDrivers,
};
