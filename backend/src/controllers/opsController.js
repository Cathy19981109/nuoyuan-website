const operationsService = require('../services/operationsService');
const moduleService = require('../services/moduleService');
const { success, fail } = require('../utils/response');

async function getSiteCenter(req, res, next) {
  try {
    const data = await operationsService.getSiteCenter();
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

async function saveSiteCenter(req, res, next) {
  try {
    const data = await operationsService.updateSiteCenter(req.body || {});
    return success(res, data, '官网中心已保存');
  } catch (err) {
    next(err);
  }
}

async function getFooterBlocks(req, res, next) {
  try {
    const data = await operationsService.getFooterBlocks();
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

async function createFooterBlock(req, res, next) {
  try {
    const data = await operationsService.createFooterBlock(req.body || {});
    return success(res, data, '页脚栏目已新增');
  } catch (err) {
    next(err);
  }
}

async function updateFooterBlock(req, res, next) {
  try {
    const data = await operationsService.updateFooterBlock(req.params.id, req.body || {});
    if (!data) return fail(res, '未找到该页脚栏目', 404, 404);
    return success(res, data, '页脚栏目已更新');
  } catch (err) {
    next(err);
  }
}

async function deleteFooterBlock(req, res, next) {
  try {
    await operationsService.deleteFooterBlock(req.params.id);
    return success(res, null, '页脚栏目已删除');
  } catch (err) {
    next(err);
  }
}

async function getInquiryFormTemplate(req, res, next) {
  try {
    const data = await operationsService.getInquiryFormTemplate();
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

async function saveInquiryFormTemplate(req, res, next) {
  try {
    const data = await operationsService.saveInquiryFormTemplate(req.body || {});
    return success(res, data, '询价表单模板已保存');
  } catch (err) {
    next(err);
  }
}

async function getStatsDashboard(req, res, next) {
  try {
    const data = await operationsService.getStatsDashboard(req.query || {});
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

async function getModuleTemplates(req, res, next) {
  try {
    const pageKey = req.params.pageKey;
    const data = moduleService.getTemplatesByPage(pageKey);
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

async function getPageModules(req, res, next) {
  try {
    const includeHidden = req.query.includeHidden === '1';
    const data = await moduleService.listModules(req.params.pageKey, includeHidden);
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

async function getPublicPageModules(req, res, next) {
  try {
    const data = await moduleService.listModules(req.params.pageKey, false);
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

async function createPageModule(req, res, next) {
  try {
    const payload = { ...req.body, page_key: req.params.pageKey };
    const data = await moduleService.createModule(payload, req.admin?.id);
    return success(res, data, '模块已新增');
  } catch (err) {
    next(err);
  }
}

async function updatePageModule(req, res, next) {
  try {
    const existing = await moduleService.getModuleById(req.params.id);
    if (!existing) return fail(res, '未找到该模块', 404, 404);
    const data = await moduleService.updateModule(req.params.id, req.body || {}, req.admin?.id);
    return success(res, data, '模块已更新');
  } catch (err) {
    next(err);
  }
}

async function deletePageModule(req, res, next) {
  try {
    const existing = await moduleService.getModuleById(req.params.id);
    if (!existing) return fail(res, '未找到该模块', 404, 404);
    await moduleService.deleteModule(req.params.id, req.admin?.id);
    return success(res, null, '模块已移入回收站（保留30天）');
  } catch (err) {
    next(err);
  }
}

async function getRecycle(req, res, next) {
  try {
    const data = await moduleService.getRecycleList(req.query || {});
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

async function restoreRecycle(req, res, next) {
  try {
    const data = await moduleService.restoreFromRecycle(req.params.id, req.admin?.id);
    if (!data) return fail(res, '回收站记录不存在', 404, 404);
    return success(res, data, '模块已恢复');
  } catch (err) {
    next(err);
  }
}

async function purgeRecycle(req, res, next) {
  try {
    await moduleService.purgeRecycle(req.params.id);
    return success(res, null, '已永久清除');
  } catch (err) {
    next(err);
  }
}

async function reorderPageModules(req, res, next) {
  try {
    const orderIds = Array.isArray(req.body?.orderIds) ? req.body.orderIds : [];
    await moduleService.reorderModules(req.params.pageKey, orderIds);
    const data = await moduleService.listModules(req.params.pageKey, true);
    return success(res, data, '模块顺序已更新');
  } catch (err) {
    next(err);
  }
}

async function reorderRecycle(req, res, next) {
  try {
    const orderIds = Array.isArray(req.body?.orderIds) ? req.body.orderIds : [];
    await moduleService.reorderRecycle(req.params.pageKey, orderIds);
    const data = await moduleService.getRecycleList({ pageKey: req.params.pageKey, pageSize: 100 });
    return success(res, data, '回收站顺序已更新');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getSiteCenter,
  saveSiteCenter,
  getFooterBlocks,
  createFooterBlock,
  updateFooterBlock,
  deleteFooterBlock,
  getInquiryFormTemplate,
  saveInquiryFormTemplate,
  getStatsDashboard,
  getModuleTemplates,
  getPageModules,
  getPublicPageModules,
  createPageModule,
  updatePageModule,
  deletePageModule,
  getRecycle,
  restoreRecycle,
  purgeRecycle,
  reorderPageModules,
  reorderRecycle,
};
