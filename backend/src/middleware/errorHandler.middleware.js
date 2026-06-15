// Global error handler — must be the LAST middleware in app.js
// Catches every error thrown anywhere in the app

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message    = err.message    || "Internal Server Error";

  // Mongoose: invalid ObjectId — e.g. /users/not-a-valid-id
  if (err.name === "CastError") {
    statusCode = 400;
    message    = `Invalid ${err.path}: ${err.value}`;
  }

  // Mongoose: duplicate unique field — e.g. email already exists
  if (err.code === 11000) {
    statusCode    = 409;
    const field   = Object.keys(err.keyValue)[0];
    message       = `${field} already exists. Please use a different ${field}.`;
  }

  // Mongoose: schema validation failed
  if (err.name === "ValidationError") {
    statusCode = 400;
    message    = Object.values(err.errors).map((e) => e.message).join(", ");
  }

  // JWT errors
  if (err.name === "JsonWebTokenError")  { statusCode = 401; message = "Invalid token."; }
  if (err.name === "TokenExpiredError")  { statusCode = 401; message = "Token expired."; }

  // Log real server errors (not 4xx client errors)
  if (statusCode >= 500) console.error("SERVER ERROR:", err);

  res.status(statusCode).json({
    success:    false,
    statusCode,
    message,
    errors:     err.errors || [],
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = errorHandler;
