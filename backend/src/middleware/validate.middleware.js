const ApiError = require("../utils/ApiError");

const validateRegister = (req, res, next) => {
  const { name, email, phone, password, role } = req.body;

  if (!name || name.trim().length < 3) {
    throw new ApiError(400, "Name must be at least 3 characters long");
  }
  if (!/^[a-zA-Z\s]+$/.test(name)) {
    throw new ApiError(400, "Name can only contain alphabets and spaces");
  }

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    throw new ApiError(400, "Invalid email address");
  }

  if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
    throw new ApiError(400, "Invalid Indian phone number (10 digits starting with 6-9)");
  }

  if (!password || password.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters long");
  }
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[!@#$%^&*]/.test(password)) {
    throw new ApiError(400, "Password must contain uppercase, lowercase, number, and special character");
  }

  if (role && !["customer", "provider"].includes(role)) {
    throw new ApiError(400, "Role must be customer or provider");
  }

  // Normalize
  req.body.name = name.trim();
  req.body.email = email.trim().toLowerCase();
  req.body.phone = phone.trim();

  next();
};

const validateLogin = (req, res, next) => {
  const { email, phone, password } = req.body;

  if ((!email && !phone) || !password) {
    throw new ApiError(400, "Email/phone and password are required");
  }

  next();
};

const validateChangePassword = (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new ApiError(400, "Current and new password are required");
  }

  if (newPassword.length < 6 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[!@#$%^&*]/.test(newPassword)) {
    throw new ApiError(400, "New password must be at least 6 characters and contain uppercase, lowercase, number, and special character");
  }

  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateChangePassword
};
