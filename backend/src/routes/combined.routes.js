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
const { uploadCategoryIcon } = require("../config/cloudinary");

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
  verifyToken, requireRole("admin"), uploadCategoryIcon.single("icon"),
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
  verifyToken, requireRole("admin"),
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
  verifyToken, requireRole("admin"),
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
adminRouter.use(verifyToken, requireRole("admin"));

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
  res.json(new ApiResponse(200, {
    users:    { total: totalCustomers },
    providers:{ total: totalProviders, verified: verifiedProviders, pending: pendingProviders },
    bookings: { total: totalBookings, completed: completedBookings, cancelled: cancelledBookings, today: todayBookings },
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
  const { isVerified } = req.body;
  if (typeof isVerified !== "boolean") throw new ApiError(400, "isVerified (true/false) is required.");
  const provider = await Provider.findByIdAndUpdate(
    req.params.id, { isVerified }, { new: true }
  ).populate("userId", "name email");
  if (!provider) throw new ApiError(404, "Provider not found.");
  res.json(new ApiResponse(200, provider, `Provider ${isVerified ? "approved" : "rejected"}.`));
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
