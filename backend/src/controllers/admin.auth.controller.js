const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin.model");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");

const generateAccessAndRefreshTokens = async (adminId) => {
  const admin = await Admin.findById(adminId);
  if (!admin) throw new ApiError(404, "Admin not found");

  const accessToken = jwt.sign(
    {
      id: admin._id,
      role: admin.role,
      permissions: admin.permissions,
    },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRY || "1d" }
  );

  const refreshToken = jwt.sign(
    {
      id: admin._id,
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRY || "10d" }
  );

  admin.refreshToken = refreshToken;
  admin.lastLogin = new Date();
  await admin.save({ validateBeforeSave: false });

  return { accessToken, refreshToken };
};

const loginAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const admin = await Admin.findOne({ email }).select("+password");
  
  if (!admin) {
    throw new ApiError(401, "Invalid credentials");
  }

  if (!admin.isActive) {
    throw new ApiError(403, "Your account has been deactivated. Please contact Super Admin.");
  }

  const isPasswordValid = await admin.comparePassword(password);
  
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(admin._id);

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
  };

  admin.password = undefined; // don't send back
  admin.refreshToken = undefined;

  res
    .status(200)
    .cookie("adminAccessToken", accessToken, options)
    .cookie("adminRefreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { admin, accessToken, refreshToken },
        "Admin logged in successfully"
      )
    );
});

const logoutAdmin = asyncHandler(async (req, res) => {
  await Admin.findByIdAndUpdate(
    req.admin._id,
    {
      $unset: { refreshToken: 1 },
    },
    { new: true }
  );

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  res
    .status(200)
    .clearCookie("adminAccessToken", options)
    .clearCookie("adminRefreshToken", options)
    .json(new ApiResponse(200, {}, "Admin logged out successfully"));
});

const getAdminProfile = asyncHandler(async (req, res) => {
  const admin = await Admin.findById(req.admin._id);
  if (!admin) {
    throw new ApiError(404, "Admin not found");
  }
  res.status(200).json(new ApiResponse(200, admin, "Profile fetched"));
});

// A seeder function to create the first Super Admin
const createFirstSuperAdmin = asyncHandler(async (req, res) => {
  const adminCount = await Admin.countDocuments();
  if (adminCount > 0) {
    throw new ApiError(403, "Super Admin already exists. Please login to manage other admins.");
  }

  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    throw new ApiError(400, "Email, password, and name are required");
  }

  const superAdmin = await Admin.create({
    name,
    email,
    password,
    role: "superadmin",
    permissions: ["*"],
    isActive: true,
  });

  superAdmin.password = undefined;

  res.status(201).json(new ApiResponse(201, superAdmin, "First Super Admin created successfully"));
});

module.exports = {
  loginAdmin,
  logoutAdmin,
  getAdminProfile,
  createFirstSuperAdmin,
};
