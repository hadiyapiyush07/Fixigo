// Custom error class
// Usage anywhere: throw new ApiError(404, "User not found")
// errorHandler middleware catches it and sends proper JSON

class ApiError extends Error {
  constructor(statusCode, message = "Something went wrong", errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.message = message;
    this.errors = errors;
    this.success = false;
  }
}

module.exports = ApiError;
