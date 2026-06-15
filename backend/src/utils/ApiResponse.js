// Standard success response shape
// Every controller returns: res.json(new ApiResponse(200, data, "message"))
// Shape: { success: true, statusCode: 200, message: "...", data: {...} }

class ApiResponse {
  constructor(statusCode, data, message = "Success") {
    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
  }
}

module.exports = ApiResponse;
