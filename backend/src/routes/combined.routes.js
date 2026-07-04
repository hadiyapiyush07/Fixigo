// ════════════════════════════════════════════════════════════
// category.routes.js
// ════════════════════════════════════════════════════════════
const express          = require("express");
const categoryRouter   = express.Router();
const ServiceCategory  = require("../models/ServiceCategory.model");
const asyncHandler     = require("../utils/asyncHandler");
const ApiResponse      = require("../utils/ApiResponse");
const ApiError         = require("../utils/ApiError");
const { verifyToken }  = require("../middleware/auth.middleware");
const { requireRole }  = require("../middleware/role.middleware");
const { verifyAdminToken, requireAdminRole } = require("../middleware/adminAuth.middleware");
const { uploadCategoryIcon } = require("../config/cloudinary");
const sendEmail = require("../utils/sendEmail");

// GET /api/categories — public, home screen
categoryRouter.get("/", asyncHandler(async (req, res) => {
  const cats = await ServiceCategory.find({ isActive: true })
    .sort({ sortOrder: 1 })
    .select("name description icon basePrice estimatedDuration subServices");
  res.json(new ApiResponse(200, cats));
}));

// GET /api/categories/:id
categoryRouter.get("/:id", asyncHandler(async (req, res) => {
  const cat = await ServiceCategory.findById(req.params.id);
  if (!cat) throw new ApiError(404, "Category not found.");
  res.json(new ApiResponse(200, cat));
}));

// POST /api/categories — admin only
categoryRouter.post("/",
  verifyAdminToken, requireAdminRole("superadmin", "admin"), uploadCategoryIcon.single("icon"),
  asyncHandler(async (req, res) => {
    const { name, description, basePrice, estimatedDuration, sortOrder } = req.body;
    if (!name || !basePrice) throw new ApiError(400, "name and basePrice are required.");
    let subServices = [];
    if (req.body.subServices) {
      subServices = typeof req.body.subServices === "string"
        ? JSON.parse(req.body.subServices)
        : req.body.subServices;
    }
    const icon = req.file ? { url: req.file.path, publicId: req.file.filename } : {};
    const cat  = await ServiceCategory.create({ name, description, basePrice, estimatedDuration, subServices, sortOrder, icon });
    res.status(201).json(new ApiResponse(201, cat, "Category created."));
  })
);

// PUT /api/categories/:id — admin only
categoryRouter.put("/:id",
  verifyAdminToken, requireAdminRole("superadmin", "admin"),
  asyncHandler(async (req, res) => {
    const cat = await ServiceCategory.findByIdAndUpdate(
      req.params.id, { $set: req.body }, { new: true, runValidators: true }
    );
    if (!cat) throw new ApiError(404, "Category not found.");
    res.json(new ApiResponse(200, cat, "Category updated."));
  })
);

// DELETE /api/categories/:id — admin only (soft delete)
categoryRouter.delete("/:id",
  verifyAdminToken, requireAdminRole("superadmin", "admin"),
  asyncHandler(async (req, res) => {
    await ServiceCategory.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json(new ApiResponse(200, null, "Category deactivated."));
  })
);

// ════════════════════════════════════════════════════════════
// admin.routes.js
// ════════════════════════════════════════════════════════════
const adminRouter  = express.Router();
const User         = require("../models/User.model");
const Provider     = require("../models/Provider.model");
const Booking      = require("../models/Booking.model");
const { getPagination, paginate } = require("../utils/pagination");

// All admin routes require admin role
adminRouter.use(verifyAdminToken, requireAdminRole("superadmin", "admin", "operations", "support", "finance"));

// GET /api/admin/stats
adminRouter.get("/stats", asyncHandler(async (req, res) => {
  const [totalCustomers, totalProviders, verifiedProviders,
         pendingProviders, totalBookings, completedBookings,
         cancelledBookings, todayBookings] = await Promise.all([
    User.countDocuments({ role: "customer" }),
    Provider.countDocuments(),
    Provider.countDocuments({ isVerified: true }),
    Provider.countDocuments({ isVerified: false }),
    Booking.countDocuments(),
    Booking.countDocuments({ status: "completed" }),
    Booking.countDocuments({ status: "cancelled" }),
    Booking.countDocuments({ createdAt: { $gte: new Date().setHours(0, 0, 0, 0) } }),
  ]);

  // Aggregate revenue from completed bookings
  const revenueData = await Booking.aggregate([
    { $match: { status: "completed" } },
    { $group: { _id: null, totalRevenue: { $sum: "$pricing.totalAmount" } } }
  ]);
  const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;
  
  // Recent Activity (last 5 bookings)
  const recentBookings = await Booking.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .populate("customerId", "name")
    .select("bookingId createdAt status customerId");

  const recentActivity = recentBookings.map(b => ({
    id: b.bookingId,
    action: `New booking #${b.bookingId} from ${b.customerId?.name || 'Customer'}`,
    time: b.createdAt
  }));

  // Weekly Bookings Chart Data
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const weeklyData = await Booking.aggregate([
    { $match: { createdAt: { $gte: sevenDaysAgo } } },
    { $group: { 
        _id: { $dayOfWeek: "$createdAt" }, 
        bookings: { $sum: 1 } 
      } 
    }
  ]);

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const chartData = [];
  
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayIndex = d.getDay();
    const dayData = weeklyData.find(w => w._id === dayIndex + 1);
    chartData.push({
      name: daysOfWeek[dayIndex],
      bookings: dayData ? dayData.bookings : 0
    });
  }

  res.json(new ApiResponse(200, {
    users:    { total: totalCustomers },
    providers:{ total: totalProviders, verified: verifiedProviders, pending: pendingProviders },
    bookings: { total: totalBookings, completed: completedBookings, cancelled: cancelledBookings, today: todayBookings },
    finance:  { totalRevenue, platformFees: totalRevenue * 0.1, pendingPayouts: 0 },
    recentActivity,
    chartData
  }));
}));

// GET /api/admin/users?role=customer&search=ravi&page=1
adminRouter.get("/users", asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};
  if (req.query.role)   filter.role = req.query.role;
  if (req.query.search) {
    filter.$or = [
      { name:  { $regex: req.query.search, $options: "i" } },
      { email: { $regex: req.query.search, $options: "i" } },
      { phone: { $regex: req.query.search, $options: "i" } },
    ];
  }
  const [data, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)
      .select("-password -refreshToken -fcmToken"),
    User.countDocuments(filter),
  ]);
  res.json(new ApiResponse(200, paginate(data, total, page, limit)));
}));

// PUT /api/admin/users/:id/toggle-status
adminRouter.put("/users/:id/toggle-status", asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, "User not found.");
  user.isActive = !user.isActive;
  await user.save({ validateBeforeSave: false });
  res.json(new ApiResponse(200, { isActive: user.isActive },
    `User ${user.isActive ? "activated" : "deactivated"}.`));
}));

// GET /api/admin/providers?verified=false&page=1
adminRouter.get("/providers", asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};
  if (req.query.verified !== undefined) filter.isVerified = req.query.verified === "true";
  const [data, total] = await Promise.all([
    Provider.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)
      .populate("userId",  "name email phone profilePhoto createdAt")
      .populate("skills",  "name"),
    Provider.countDocuments(filter),
  ]);
  res.json(new ApiResponse(200, paginate(data, total, page, limit)));
}));

// PUT /api/admin/providers/:id/verify
adminRouter.put("/providers/:id/verify", asyncHandler(async (req, res) => {
  const { isVerified, verificationStatus, reason } = req.body;
  
  let updateObj = {};
  if (verificationStatus !== undefined) {
    if (!["pending", "verified", "rejected", "suspended"].includes(verificationStatus)) {
      throw new ApiError(400, "Invalid verificationStatus. Must be 'pending', 'verified', 'rejected', or 'suspended'.");
    }
    updateObj.verificationStatus = verificationStatus;
    updateObj.isVerified = (verificationStatus === "verified");
  } else if (isVerified !== undefined) {
    if (typeof isVerified !== "boolean") {
      throw new ApiError(400, "isVerified must be a boolean.");
    }
    updateObj.isVerified = isVerified;
    updateObj.verificationStatus = isVerified ? "verified" : "rejected";
  } else {
    throw new ApiError(400, "Either isVerified or verificationStatus is required.");
  }

  // If rejected, pending, or suspended, provider must go offline
  if (updateObj.isVerified === false) {
    updateObj.status = "offline";
  }

  const provider = await Provider.findByIdAndUpdate(
    req.params.id,
    { $set: updateObj },
    { new: true }
  ).populate("userId", "name email");

  if (!provider) throw new ApiError(404, "Provider not found.");

  // Send Email Notification
  if (provider.userId?.email) {
    let emailSubject = '';
    let emailHtml = '';

    if (updateObj.verificationStatus === 'verified') {
      emailSubject = 'Profile Verified - Welcome to Fixigo!';
      emailHtml = `<p>Hi ${provider.userId.name},</p><p>Great news! Your provider profile has been successfully verified. You can now go online and start accepting jobs.</p>`;
    } else if (updateObj.verificationStatus === 'rejected') {
      emailSubject = 'Action Required: Profile Verification Update';
      emailHtml = `<p>Hi ${provider.userId.name},</p><p>We have reviewed your profile and it requires updates before we can verify you.</p>
                   <p><strong>Reason:</strong> ${reason || 'Please ensure all your details are correct and professional.'}</p>
                   <p>Please log in and complete/update your profile.</p>`;
    } else if (updateObj.verificationStatus === 'suspended') {
      emailSubject = 'Account Suspended';
      emailHtml = `<p>Hi ${provider.userId.name},</p><p>Your provider account has been temporarily suspended.</p>
                   <p><strong>Reason:</strong> ${reason || 'Violation of terms or inactivity.'}</p>
                   <p>Please contact support for more details.</p>`;
    }
    
    if (emailSubject && emailHtml) {
      // Don't await strictly to prevent slow responses, but handle rejection
      sendEmail({
        email: provider.userId.email,
        subject: emailSubject,
        html: emailHtml
      }).catch(err => console.error('Failed to send email:', err));
    }
  }

  res.json(new ApiResponse(200, provider, `Provider verification status updated to ${provider.verificationStatus}.`));
}));

// GET /api/admin/bookings?status=pending&page=1
adminRouter.get("/bookings", asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  const [data, total] = await Promise.all([
    Booking.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)
      .populate("customerId", "name phone")
      .populate("categoryId", "name")
      .populate({ path: "providerId", populate: { path: "userId", select: "name phone" } })
      .select("-statusHistory -rejectedProviders"),
    Booking.countDocuments(filter),
  ]);
  res.json(new ApiResponse(200, paginate(data, total, page, limit)));
}));

const { getAllCoupons, createCoupon, deleteCoupon } = require("../controllers/coupon.controller");

adminRouter.get("/coupons", asyncHandler(getAllCoupons));
adminRouter.post("/coupons", asyncHandler(createCoupon));
adminRouter.delete("/coupons/:id", asyncHandler(deleteCoupon));

module.exports = { categoryRouter, adminRouter };

// ══════════════════════════════════════════════════════════════
// POSTMAN — CATEGORIES
// GET  http://localhost:5000/api/categories              (public)
// POST http://localhost:5000/api/categories              (admin, multipart/form-data)
//      fields: name="AC Repair", basePrice=499, estimatedDuration=90
//      file:   icon = any PNG image
//
// SEED CATEGORIES in MongoDB Compass (paste in mongosh):
// use servicebook
// db.servicecategories.insertMany([
//   { name:"Electrician",     basePrice:299, estimatedDuration:60,  sortOrder:1, isActive:true, createdAt:new Date() },
//   { name:"Plumber",         basePrice:299, estimatedDuration:60,  sortOrder:2, isActive:true, createdAt:new Date() },
//   { name:"AC Repair",       basePrice:499, estimatedDuration:90,  sortOrder:3, isActive:true, createdAt:new Date() },
//   { name:"Home Cleaning",   basePrice:599, estimatedDuration:120, sortOrder:4, isActive:true, createdAt:new Date() },
//   { name:"Painter",         basePrice:999, estimatedDuration:180, sortOrder:5, isActive:true, createdAt:new Date() },
//   { name:"Carpenter",       basePrice:399, estimatedDuration:90,  sortOrder:6, isActive:true, createdAt:new Date() },
//   { name:"Appliance Repair",basePrice:399, estimatedDuration:60,  sortOrder:7, isActive:true, createdAt:new Date() }
// ])
//
// POSTMAN — ADMIN (all need admin token)
// GET  http://localhost:5000/api/admin/stats
// GET  http://localhost:5000/api/admin/providers?verified=false
// PUT  http://localhost:5000/api/admin/providers/<id>/verify   Body: { "isVerified": true }
// GET  http://localhost:5000/api/admin/bookings?status=pending
// GET  http://localhost:5000/api/admin/users?search=ravi
