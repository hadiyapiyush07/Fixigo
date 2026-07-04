const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String, required: [true, "Name is required"],
      trim: true, minlength: 2, maxlength: 50,
    },
    email: {
      type: String, required: [true, "Email is required"],
      unique: true, lowercase: true, trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },
    phone: {
      type: String, required: [true, "Phone is required"],
      unique: true, trim: true,
      match: [/^[6-9]\d{9}$/, "Invalid Indian phone number (10 digits starting 6-9)"],
    },
    password: {
      type: String, required: [true, "Password is required"],
      minlength: 6,
      select: false,  // NEVER returned in queries — must use .select("+password") explicitly
    },

    role: {
      type: String,
      enum: ["customer", "provider"],
      required: true,
    },

    profilePhoto:          { type: String, default: null },  // Cloudinary URL
    profilePhotoPublicId:  { type: String, default: null },  // Cloudinary public_id for deletion

    // Firebase push notification tokens (Array to support multiple devices)
    fcmTokens: { type: [String], default: [], select: false },
    devicePlatform: { type: String, enum: ['android', 'ios', 'web', null], default: null },
    appVersion: { type: String, default: null },
    lastActive: { type: Date, default: Date.now },
    notificationsEnabled: { type: Boolean, default: true },

    isActive:       { type: Boolean, default: true },
    isPhoneVerified:{ type: Boolean, default: false },

    // Customer's saved addresses for quick re-booking
    savedAddresses: [
      {
        label:       { type: String, default: "Home" },  // Home | Work | Other
        isDefault:   { type: Boolean, default: false },
        addressLine: String,
        city:        String,
        pincode:     String,
        location: {
          type:        { type: String, default: "Point" },
          coordinates: { type: [Number], default: [0, 0] }, // [longitude, latitude]
        },
      },
    ],

    refreshToken: { type: String, select: false },

    // Brute force protection
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
  },
  { timestamps: true }
);

// Hash password before save — only when password field is modified
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare entered password with stored hash
// Usage: const isMatch = await user.comparePassword(enteredPassword)
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.index({ "savedAddresses.location": "2dsphere" });

const User = mongoose.model("User", userSchema);
module.exports = User;
