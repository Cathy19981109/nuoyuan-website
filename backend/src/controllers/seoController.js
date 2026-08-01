const seoService = require('../services/seoService');
const { success, fail } = require('../utils/response');

async function getGlobal(req, res, next) {
  try {
    const data = await seoService.getGlobalSeo();
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

async function saveGlobal(req, res, next) {
  try {
    const data = await seoService.saveGlobalSeo(req.body || {});
    return success(res, data, '全站SEO已保存');
  } catch (err) {
    next(err);
  }
}

async function getPageList(req, res, next) {
  try {
    const data = await seoService.listPageSeo();
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

async function savePage(req, res, next) {
  try {
    const data = await seoService.savePageSeo(req.params.id, req.body || {});
    if (!data) return fail(res, '栏目不存在', 404, 404);
    return success(res, data, '栏目SEO已保存');
  } catch (err) {
    next(err);
  }
}

async function listProduct(req, res, next) {
  try {
    const data = await seoService.listProductSeo(req.query || {});
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

async function saveProduct(req, res, next) {
  try {
    const data = await seoService.saveProductSeo(req.params.id, req.body || {});
    if (!data) return fail(res, '产品不存在', 404, 404);
    return success(res, data, '产品SEO已保存');
  } catch (err) {
    next(err);
  }
}

async function listService(req, res, next) {
  try {
    const data = await seoService.listServiceSeo(req.query || {});
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

async function saveService(req, res, next) {
  try {
    const data = await seoService.saveServiceSeo(req.params.id, req.body || {});
    if (!data) return fail(res, '服务不存在', 404, 404);
    return success(res, data, '服务SEO已保存');
  } catch (err) {
    next(err);
  }
}

async function listNews(req, res, next) {
  try {
    const data = await seoService.listNewsSeo(req.query || {});
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

async function saveNews(req, res, next) {
  try {
    const data = await seoService.saveNewsSeo(req.params.id, req.body || {});
    if (!data) return fail(res, '资讯不存在', 404, 404);
    return success(res, data, '资讯SEO已保存');
  } catch (err) {
    next(err);
  }
}

async function autoSync(req, res, next) {
  try {
    const mode = String(req.body?.mode || req.query?.mode || 'fill_empty');
    const data = await seoService.autoSyncSeo({ mode });
    return success(res, data, 'SEO已从内容自动同步');
  } catch (err) {
    next(err);
  }
}

async function getPublicMeta(req, res, next) {
  try {
    const data = await seoService.getSeoMetaForPage(req.query || {});
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getGlobal,
  saveGlobal,
  getPageList,
  savePage,
  listProduct,
  saveProduct,
  listService,
  saveService,
  listNews,
  saveNews,
  autoSync,
  getPublicMeta,
};
