function success(res, data = null, message = 'success') {
  return res.json({ code: 0, message, data });
}

function fail(res, message = 'error', code = 1, status = 400) {
  return res.status(status).json({ code, message, data: null });
}

function paginate(list, total, page, pageSize) {
  return {
    list,
    pagination: {
      total,
      page: parseInt(page, 10),
      pageSize: parseInt(pageSize, 10),
      totalPages: Math.ceil(total / pageSize) || 0,
    },
  };
}

module.exports = { success, fail, paginate };
