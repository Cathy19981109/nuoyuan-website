const applicationService = require('../services/applicationService');
const { success, fail } = require('../utils/response');

async function getPublicList(req, res, next) {
  try {
    const data = await applicationService.getPublicApplications();
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

async function getPublicById(req, res, next) {
  try {
    const data = await applicationService.getPublicApplication(req.params.id);
    if (!data) return fail(res, '应用领域不存在', 404, 404);
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

async function getAdminList(req, res, next) {
  try {
    const data = await applicationService.getAdminApplications(req.query);
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

async function getAdminById(req, res, next) {
  try {
    const data = await applicationService.getApplicationById(req.params.id);
    if (!data) return fail(res, '应用领域不存在', 404, 404);
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const data = await applicationService.createApplication(req.body);
    return success(res, data, '创建成功');
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const existing = await applicationService.getApplicationById(req.params.id);
    if (!existing) return fail(res, '应用领域不存在', 404, 404);
    const data = await applicationService.updateApplication(req.params.id, req.body);
    return success(res, data, '更新成功');
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const existing = await applicationService.getApplicationById(req.params.id);
    if (!existing) return fail(res, '应用领域不存在', 404, 404);
    await applicationService.deleteApplication(req.params.id);
    return success(res, null, '删除成功');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getPublicList,
  getPublicById,
  getAdminList,
  getAdminById,
  create,
  update,
  remove,
};
