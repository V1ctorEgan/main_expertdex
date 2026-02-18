const User = require("../model/Users");
const CompanyProfile = require("../model/CompanyProfile");
const bcrypt = require("bcryptjs");

/**
 * Complete Company Onboarding
 * This endpoint handles the full company registration:
 * 1. Creates a User account (for authentication)
 * 2. Creates a CompanyProfile (for company-specific data)
 */

const getAllCompanies = async (req, res) => {
  const companies = await CompanyProfile.find()
    .populate("userId", "email accountType isVerified")
    .sort({ createdAt: -1 }) // Newest first
    .exec();
  if (!companies) return res.status(204).json({ message: "no company found" });
  console.log(companies);
  res.status(200).json({
    success: true,
    count: companies.length,
    data: companies,
  });
};

const handleCompanyOnboarding = async (req, res) => {
  console.log("Incoming company onboarding req.body:", req.body);

  const {
    // Step 1 fields
    companyImage,
    enterpriseName,
    enterpriseDescription,
    enterpriseSize,
    companyLogo,
    contactName,
    contactEmail,
    password,
    confirmPassword,
    acceptTerms,

    // Step 2 fields
    taxId,
    taxIdApplicable,
    nin,
    cacDocument,
    cacDocumentDetails,
  } = req.body;

  // Validation: Required fields from Step 1
  if (!enterpriseName || !enterpriseDescription || !enterpriseSize) {
    return res.status(400).json({
      message: "Enterprise name, description, and size are required.",
    });
  }

  if (!contactName || !contactEmail) {
    return res.status(400).json({
      message: "Contact name and email are required.",
    });
  }

  if (!password || password.length < 6) {
    return res.status(400).json({
      message: "Password must be at least 6 characters long.",
    });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({
      message: "Passwords do not match.",
    });
  }

  if (!acceptTerms) {
    return res.status(400).json({
      message: "You must accept the terms and conditions.",
    });
  }

  // Validation: Required fields from Step 2
  if (!nin) {
    return res.status(400).json({
      message: "NIN is required.",
    });
  }

  if (!cacDocument || !cacDocumentDetails) {
    return res.status(400).json({
      message: "CAC Registration Certificate and details are required.",
    });
  }

  // Validation: Tax ID required if applicable
  if (taxIdApplicable && !taxId) {
    return res.status(400).json({
      message: "Tax ID is required for your enterprise size.",
    });
  }

  try {
    // Check for duplicate email in Users collection
    const existingUser = await User.findOne({ email: contactEmail }).exec();
    if (existingUser) {
      return res.status(409).json({
        message: "Email already registered.",
      });
    }

    // Hash the password
    const hashedPwd = await bcrypt.hash(password, 10);

    // Create User account
    const newUser = await User.create({
      name: enterpriseName,
      email: contactEmail,
      password: hashedPwd,
      accountType: "company",
      phoneNumber: 0, // Companies might not have a direct phone in User model
    });

    console.log("User created:", newUser);

    // Create Company Profile
    const companyProfile = await CompanyProfile.create({
      userId: newUser._id,
      companyImage: companyImage || null,
      enterpriseName,
      enterpriseDescription,
      enterpriseSize,
      companyLogo: companyLogo || null,
      contactName,
      contactEmail,
      taxId: taxId || "",
      taxIdApplicable: taxIdApplicable !== false, // Default to true
      nin,
      cacDocument,
      cacDocumentDetails,
      acceptTerms,
      isVerified: false, // Admin needs to verify
      isApproved: false, // Admin needs to approve
      totalDrivers: 0,
      totalVehicles: 0,
    });

    console.log("Company profile created:", companyProfile);

    res.status(201).json({
      success: true,
      message: "Company registration successful!",
      data: {
        userId: newUser._id,
        email: newUser.email,
        accountType: newUser.accountType,
        companyProfileId: companyProfile._id,
        enterpriseName: companyProfile.enterpriseName,
        contactName: companyProfile.contactName,
      },
    });
  } catch (err) {
    console.error("Company onboarding error:", err);

    res.status(500).json({
      message: "Registration failed. Please try again.",
      error: err.message,
    });
  }
};

/**
 * Get Company Profile by User ID
 */
const getCompanyProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    const companyProfile = await CompanyProfile.findOne({ userId })
      .populate("userId", "email accountType isVerified")
      .exec();

    if (!companyProfile) {
      return res.status(404).json({
        message: "Company profile not found.",
      });
    }

    res.status(200).json({
      success: true,
      data: companyProfile,
    });
  } catch (err) {
    console.error("Get company profile error:", err);
    res.status(500).json({
      message: "Failed to fetch company profile.",
      error: err.message,
    });
  }
};

/**
 * Update Company Profile
 */
const updateCompanyProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;

    // Prevent updating sensitive fields
    delete updateData.userId;
    delete updateData.isVerified;
    delete updateData.isApproved;
    delete updateData.totalDrivers;
    delete updateData.totalVehicles;

    const updatedProfile = await CompanyProfile.findOneAndUpdate(
      { userId },
      updateData,
      { new: true, runValidators: true },
    );

    if (!updatedProfile) {
      return res.status(404).json({
        message: "Company profile not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Company profile updated successfully.",
      data: updatedProfile,
    });
  } catch (err) {
    console.error("Update company profile error:", err);
    res.status(500).json({
      message: "Failed to update company profile.",
      error: err.message,
    });
  }
};

/**
 * Get all drivers for a company
 */
const getCompanyDrivers = async (req, res) => {
  try {
    const { userId } = req.params;

    // First verify company exists
    const companyProfile = await CompanyProfile.findOne({ userId });
    if (!companyProfile) {
      return res.status(404).json({
        message: "Company profile not found.",
      });
    }

    // Get all drivers assigned to this company
    const DriverProfile = require("../model/DriverProfiles");
    const drivers = await DriverProfile.find({ companyId: companyProfile._id })
      .populate("userId", "email isVerified")
      .exec();

    res.status(200).json({
      success: true,
      count: drivers.length,
      data: drivers,
    });
  } catch (err) {
    console.error("Get company drivers error:", err);
    res.status(500).json({
      message: "Failed to fetch company drivers.",
      error: err.message,
    });
  }
};

module.exports = {
  handleCompanyOnboarding,
  getCompanyProfile,
  updateCompanyProfile,
  getCompanyDrivers,
  getAllCompanies,
};
