const productService = require('../services/productService');
const { success, fail } = require('../utils/response');

async function getCategoryTree(req, res, next) {
  try {
    const data = await productService.getPublicCategoryTree();
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

async function getAllCategories(req, res, next) {
  try {
    const data = await productService.getAllCategories();
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

async function getCategoryById(req, res, next) {
  try {
    const data = await productService.getCategoryById(req.params.id);
    if (!data) return fail(res, '分类不存在', 404, 404);
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

async function createCategory(req, res, next) {
  try {
    const data = await productService.createCategory(req.body);
    return success(res, data, '创建成功');
  } catch (err) {
    next(err);
  }
}

async function updateCategory(req, res, next) {
  try {
    const existing = await productService.getCategoryById(req.params.id);
    if (!existing) return fail(res, '分类不存在', 404, 404);
    const data = await productService.updateCategory(req.params.id, req.body);
    return success(res, data, '更新成功');
  } catch (err) {
    next(err);
  }
}

async function deleteCategory(req, res, next) {
  try {
    const existing = await productService.getCategoryById(req.params.id);
    if (!existing) return fail(res, '分类不存在', 404, 404);
    await productService.deleteCategory(req.params.id);
    return success(res, null, '删除成功');
  } catch (err) {
    next(err);
  }
}

async function getPublicList(req, res, next) {
  try {
    const { categoryId, categoryIds, goodsCodes, isHot, keyword, page, pageSize, productType, productTypes, appType, appTypes, levelTag, levelTags, tagFilters } = req.query;
    const parseTagFilters = () => {
      if (!tagFilters) return {};
      if (typeof tagFilters === 'string') {
        try { return JSON.parse(tagFilters); } catch { return {}; }
      }
      if (typeof tagFilters === 'object') return tagFilters;
      return {};
    };
    const parseMulti = (primary, fallback) => {
      const raw = primary !== undefined ? primary : fallback;
      if (Array.isArray(raw)) return raw.map((v) => String(v || '').trim()).filter(Boolean);
      if (typeof raw === 'string') return raw.split(',').map((v) => v.trim()).filter(Boolean);
      return [];
    };
    const normalizedCategoryIds = parseMulti(categoryIds, categoryId);
    const normalizedGoodsCodes = parseMulti(goodsCodes, undefined);
    const normalizedProductTypes = parseMulti(productTypes, productType);
    const normalizedAppTypes = parseMulti(appTypes, appType);
    const normalizedLevelTags = parseMulti(levelTags, levelTag);
    const data = await productService.getPublicProducts({
      categoryId,
      categoryIds: normalizedCategoryIds,
      goodsCodes: normalizedGoodsCodes,
      isHot,
      keyword,
      page,
      pageSize,
      productTypes: normalizedProductTypes,
      appTypes: normalizedAppTypes,
      levelTags: normalizedLevelTags,
      tagFilters: parseTagFilters(),
    });
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

async function createFilterGroup(req, res, next) {
  try {
    const data = await productService.createFilterGroup(req.body);
    return success(res, data, '创建成功');
  } catch (err) {
    next(err);
  }
}

async function updateFilterGroup(req, res, next) {
  try {
    const data = await productService.updateFilterGroup(req.params.id, req.body);
    if (!data) return fail(res, '筛选分组不存在', 404, 404);
    return success(res, data, '更新成功');
  } catch (err) {
    next(err);
  }
}

async function deleteFilterGroup(req, res, next) {
  try {
    await productService.deleteFilterGroup(req.params.id);
    return success(res, null, '删除成功');
  } catch (err) {
    next(err);
  }
}

async function reorderFilterGroups(req, res, next) {
  try {
    const orderIds = Array.isArray(req.body?.orderIds) ? req.body.orderIds : [];
    await productService.reorderFilterGroups(orderIds);
    const data = await productService.getFilterTagOptionsAdmin();
    return success(res, data, '分组顺序已更新');
  } catch (err) {
    next(err);
  }
}

async function getAdminList(req, res, next) {
  try {
    const data = await productService.getAdminProducts(req.query);
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

async function getPublicById(req, res, next) {
  try {
    const data = await productService.getPublicProduct(req.params.id);
    if (!data) return fail(res, '产品不存在', 404, 404);
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

async function getAdminById(req, res, next) {
  try {
    const data = await productService.getProductById(req.params.id);
    if (!data) return fail(res, '产品不存在', 404, 404);
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

async function searchByCode(req, res, next) {
  try {
    const productCode = String(req.query?.productCode || '').trim();
    if (!productCode) return fail(res, '请输入5位产品编号', 400, 400);
    const data = await productService.getProductByCode(productCode);
    if (!data) return fail(res, '未找到该产品编号', 404, 404);
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const data = await productService.createProduct(req.body);
    return success(res, data, '创建成功');
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const existing = await productService.getProductById(req.params.id);
    if (!existing) return fail(res, '产品不存在', 404, 404);
    const data = await productService.updateProduct(req.params.id, req.body);
    return success(res, data, '更新成功');
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const existing = await productService.getProductById(req.params.id);
    if (!existing) return fail(res, '产品不存在', 404, 404);
    await productService.deleteProduct(req.params.id);
    return success(res, null, '删除成功');
  } catch (err) {
    next(err);
  }
}

async function reorder(req, res, next) {
  try {
    const orderIds = Array.isArray(req.body?.orderIds) ? req.body.orderIds : [];
    await productService.reorderProducts(orderIds);
    const data = await productService.getAdminProducts({ page: 1, pageSize: 50 });
    return success(res, data, '产品顺序已更新');
  } catch (err) {
    next(err);
  }
}

async function reorderProductCategories(req, res, next) {
  try {
    const orderIds = Array.isArray(req.body?.orderIds) ? req.body.orderIds : [];
    await productService.reorderCategories(orderIds);
    const data = await productService.getAllCategories();
    return success(res, data, '分类顺序已更新');
  } catch (err) {
    next(err);
  }
}

async function getFilterTagsPublic(req, res, next) {
  try {
    const data = await productService.getFilterTagOptionsPublic();
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

async function getFilterTagsAdmin(req, res, next) {
  try {
    const data = await productService.getFilterTagOptionsAdmin();
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

async function createFilterTag(req, res, next) {
  try {
    const payload = { ...req.body };
    if (!payload.tag_group && payload.group_key) payload.tag_group = payload.group_key;
    const data = await productService.createFilterTag(payload);
    return success(res, data, '创建成功');
  } catch (err) {
    next(err);
  }
}

async function updateFilterTag(req, res, next) {
  try {
    const data = await productService.updateFilterTag(req.params.id, req.body);
    if (!data) return fail(res, '标签不存在', 404, 404);
    return success(res, data, '更新成功');
  } catch (err) {
    next(err);
  }
}

async function deleteFilterTag(req, res, next) {
  try {
    await productService.deleteFilterTag(req.params.id);
    return success(res, null, '删除成功');
  } catch (err) {
    next(err);
  }
}

async function reorderFilterTags(req, res, next) {
  try {
    const tagGroup = String(req.params.tagGroup || '').trim();
    const orderIds = Array.isArray(req.body?.orderIds) ? req.body.orderIds : [];
    await productService.reorderFilterTags(tagGroup, orderIds);
    const data = await productService.getFilterTagOptionsAdmin();
    return success(res, data, '标签顺序已更新');
  } catch (err) {
    next(err);
  }
}

async function getFilterStats(req, res, next) {
  try {
    const {
      keyword = '',
      productTypes,
      appTypes,
      levelTags,
      tagFilters,
    } = req.query;
    const parseList = (val) => (typeof val === 'string'
      ? val.split(',').map((v) => v.trim()).filter(Boolean)
      : []);
    const parsedTagFilters = (() => {
      if (!tagFilters) return {};
      if (typeof tagFilters === 'string') {
        try { return JSON.parse(tagFilters); } catch { return {}; }
      }
      if (typeof tagFilters === 'object') return tagFilters;
      return {};
    })();
    const data = await productService.getFilterStats({
      keyword,
      productTypes: parseList(productTypes),
      appTypes: parseList(appTypes),
      levelTags: parseList(levelTags),
      tagFilters: parsedTagFilters,
    });
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getCategoryTree,
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderProductCategories,
  getFilterTagsPublic,
  getFilterTagsAdmin,
  createFilterGroup,
  updateFilterGroup,
  deleteFilterGroup,
  reorderFilterGroups,
  createFilterTag,
  updateFilterTag,
  deleteFilterTag,
  reorderFilterTags,
  getFilterStats,
  getPublicList,
  getAdminList,
  getPublicById,
  getAdminById,
  searchByCode,
  create,
  update,
  remove,
  reorder,
};
