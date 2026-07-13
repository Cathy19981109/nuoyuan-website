const pageService = require('../services/pageService');
const { success, fail } = require('../utils/response');

async function getById(req, res, next) {
  try {
    const data = await pageService.getPublicPage(req.params.id);
    if (!data) return fail(res, '页面不存在', 404, 404);
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

async function getByNavName(req, res, next) {
  try {
    const data = await pageService.getPublicPageByNavName(req.params.navName);
    if (!data) return fail(res, '页面不存在', 404, 404);
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

async function getList(req, res, next) {
  try {
    const data = await pageService.getPageList(req.query);
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

async function getAdminById(req, res, next) {
  try {
    const data = await pageService.getPageById(req.params.id);
    if (!data) return fail(res, '页面不存在', 404, 404);
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const data = await pageService.createPage(req.body);
    return success(res, data, '创建成功');
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const existing = await pageService.getPageById(req.params.id);
    if (!existing) return fail(res, '页面不存在', 404, 404);
    const data = await pageService.updatePage(req.params.id, req.body);
    return success(res, data, '更新成功');
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const existing = await pageService.getPageById(req.params.id);
    if (!existing) return fail(res, '页面不存在', 404, 404);
    await pageService.deletePage(req.params.id);
    return success(res, null, '删除成功');
  } catch (err) {
    next(err);
  }
}

module.exports = { getById, getByNavName, getList, getAdminById, create, update, remove };
