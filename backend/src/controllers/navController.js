const navService = require('../services/navService');
const { success, fail } = require('../utils/response');

async function getNavTree(req, res, next) {
  try {
    const data = await navService.getPublicNavTree();
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

async function getAll(req, res, next) {
  try {
    const data = await navService.getAllNav();
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const data = await navService.getNavById(req.params.id);
    if (!data) return fail(res, '导航不存在', 404, 404);
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const data = await navService.createNav(req.body);
    return success(res, data, '创建成功');
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const existing = await navService.getNavById(req.params.id);
    if (!existing) return fail(res, '导航不存在', 404, 404);
    const data = await navService.updateNav(req.params.id, req.body);
    return success(res, data, '更新成功');
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const existing = await navService.getNavById(req.params.id);
    if (!existing) return fail(res, '导航不存在', 404, 404);
    await navService.deleteNav(req.params.id);
    return success(res, null, '删除成功');
  } catch (err) {
    next(err);
  }
}

async function reorder(req, res, next) {
  try {
    const orderIds = Array.isArray(req.body?.orderIds) ? req.body.orderIds : [];
    await navService.reorderNav(orderIds);
    const data = await navService.getAllNav();
    return success(res, data, '导航顺序已更新');
  } catch (err) {
    next(err);
  }
}

module.exports = { getNavTree, getAll, getById, create, update, remove, reorder };
