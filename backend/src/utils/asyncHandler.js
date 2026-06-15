// Removes try/catch from every controller
// Wraps any async function so errors go to errorHandler automatically
//
// Usage:
//   const getUser = asyncHandler(async (req, res) => {
//     const user = await User.findById(req.params.id)
//     res.json(new ApiResponse(200, user))
//   })

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
