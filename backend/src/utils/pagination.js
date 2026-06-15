// Mobile-friendly pagination
// Loads small pages so phone RAM is not overloaded
// Default: 10 items per page, max: 50

// Call in controller: const { skip, limit, page } = getPagination(req.query)
const getPagination = (query) => {
  const page  = Math.max(1,  parseInt(query.page)  || 1);
  const limit = Math.min(50, parseInt(query.limit) || 10);
  const skip  = (page - 1) * limit;
  return { page, limit, skip };
};

// Wrap your data with pagination metadata before sending to mobile app
// Mobile app checks hasNextPage to decide whether to show "Load more"
const paginate = (data, total, page, limit) => {
  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages:  Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
    },
  };
};

module.exports = { getPagination, paginate };
