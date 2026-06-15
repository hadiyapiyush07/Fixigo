const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

// Configure with your Cloudinary credentials from .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Reject non-image files before uploading
const imageFileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only jpg, png, webp files are allowed"), false);
  }
};

// ── Profile photo upload ──────────────────────────────────────────────────
// Usage in route: router.put("/profile", uploadProfile.single("profilePhoto"), controller)
// In controller:  req.file.path = Cloudinary URL
const uploadProfile = multer({
  storage: new CloudinaryStorage({
    cloudinary,
    params: {
      folder:          "servicebook/profiles",
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      transformation:  [{ width: 500, height: 500, crop: "limit" }],
    },
  }),
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
});

// ── Service/work photos — up to 5 photos ─────────────────────────────────
// Usage in route: router.post("/service", uploadServicePhotos.array("photos", 5), controller)
// In controller:  req.files = array, each has .path = Cloudinary URL
const uploadServicePhotos = multer({
  storage: new CloudinaryStorage({
    cloudinary,
    params: {
      folder:          "servicebook/services",
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      transformation:  [{ width: 1200, height: 800, crop: "limit" }],
    },
  }),
  fileFilter: imageFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB per file
});

// ── Category icon upload (admin only) ────────────────────────────────────
const uploadCategoryIcon = multer({
  storage: new CloudinaryStorage({
    cloudinary,
    params: {
      folder:          "servicebook/categories",
      allowed_formats: ["jpg", "jpeg", "png", "webp", "svg"],
      transformation:  [{ width: 200, height: 200, crop: "limit" }],
    },
  }),
  fileFilter: imageFileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
});

// Delete a file from Cloudinary (call when user replaces their photo)
// publicId example: "servicebook/profiles/profile_abc123"
const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log(`🗑️  Cloudinary deleted: ${publicId} → ${result.result}`);
  } catch (error) {
    console.error(`❌ Cloudinary delete failed: ${error.message}`);
  }
};

module.exports = {
  cloudinary,
  uploadProfile,
  uploadServicePhotos,
  uploadCategoryIcon,
  deleteFromCloudinary,
};
