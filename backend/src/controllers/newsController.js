const newsService = require('../services/newsService');
const { success, fail } = require('../utils/response');

async function getPublicCategories(req, res, next) {
  try {
    const data = await newsService.getPublicNewsCategories();
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

async function getAllCategories(req, res, next) {
  try {
    const data = await newsService.getAllNewsCategories();
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

async function getCategoryById(req, res, next) {
  try {
    const data = await newsService.getNewsCategoryById(req.params.id);
    if (!data) return fail(res, '分类不存在', 404, 404);
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

async function createCategory(req, res, next) {
  try {
    const data = await newsService.createNewsCategory(req.body);
    return success(res, data, '创建成功');
  } catch (err) {
    next(err);
  }
}

async function updateCategory(req, res, next) {
  try {
    const existing = await newsService.getNewsCategoryById(req.params.id);
    if (!existing) return fail(res, '分类不存在', 404, 404);
    const data = await newsService.updateNewsCategory(req.params.id, req.body);
    return success(res, data, '更新成功');
  } catch (err) {
    next(err);
  }
}

async function deleteCategory(req, res, next) {
  try {
    const existing = await newsService.getNewsCategoryById(req.params.id);
    if (!existing) return fail(res, '分类不存在', 404, 404);
    await newsService.deleteNewsCategory(req.params.id);
    return success(res, null, '删除成功');
  } catch (err) {
    next(err);
  }
}

async function getPublicList(req, res, next) {
  try {
    const { categoryId, page, pageSize } = req.query;
    const data = await newsService.getPublicNewsList({ categoryId, page, pageSize });
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

async function getAdminList(req, res, next) {
  try {
    const data = await newsService.getAdminNewsList(req.query);
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

async function getPublicById(req, res, next) {
  try {
    const data = await newsService.getPublicNews(req.params.id);
    if (!data) return fail(res, '新闻不存在', 404, 404);
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

async function getAdminById(req, res, next) {
  try {
    const data = await newsService.getNewsById(req.params.id);
    if (!data) return fail(res, '新闻不存在', 404, 404);
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const data = await newsService.createNews(req.body);
    return success(res, data, '创建成功');
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const existing = await newsService.getNewsById(req.params.id);
    if (!existing) return fail(res, '新闻不存在', 404, 404);
    const data = await newsService.updateNews(req.params.id, req.body);
    return success(res, data, '更新成功');
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const existing = await newsService.getNewsById(req.params.id);
    if (!existing) return fail(res, '新闻不存在', 404, 404);
    await newsService.deleteNews(req.params.id);
    return success(res, null, '删除成功');
  } catch (err) {
    next(err);
  }
}

async function reorder(req, res, next) {
  try {
    const orderIds = Array.isArray(req.body?.orderIds) ? req.body.orderIds : [];
    await newsService.reorderNews(orderIds);
    const data = await newsService.getAdminNewsList({ page: 1, pageSize: 50 });
    return success(res, data, '新闻顺序已更新');
  } catch (err) {
    next(err);
  }
}

async function reorderCategories(req, res, next) {
  try {
    const orderIds = Array.isArray(req.body?.orderIds) ? req.body.orderIds : [];
    await newsService.reorderNewsCategories(orderIds);
    const data = await newsService.getAllNewsCategories();
    return success(res, data, '分类顺序已更新');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getPublicCategories,
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
  getPublicList,
  getAdminList,
  getPublicById,
  getAdminById,
  create,
  update,
  remove,
  reorder,
};
