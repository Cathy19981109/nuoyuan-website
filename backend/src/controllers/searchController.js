const searchService = require('../services/searchService');
const { success } = require('../utils/response');

async function search(req, res, next) {
  try {
    const { keyword, page, pageSize } = req.query;
    const data = await searchService.search(keyword, { page, pageSize });
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

module.exports = { search };
