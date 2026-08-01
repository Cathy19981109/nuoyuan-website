const serviceService = require('../services/serviceService');
const { success, fail } = require('../utils/response');

async function getCategoryTree(req, res, next) {
  try {
    const data = await serviceService.getPublicCategoryTree();
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

async function getAllCategories(req, res, next) {
  try {
    const data = await serviceService.getAllCategories();
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

async function getCategoryById(req, res, next) {
  try {
    const data = await serviceService.getCategoryById(req.params.id);
    if (!data) return fail(res, '分类不存在', 404, 404);
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

async function createCategory(req, res, next) {
  try {
    const data = await serviceService.createCategory(req.body);
    return success(res, data, '创建成功');
  } catch (err) {
    next(err);
  }
}

async function updateCategory(req, res, next) {
  try {
    const existing = await serviceService.getCategoryById(req.params.id);
    if (!existing) return fail(res, '分类不存在', 404, 404);
    const data = await serviceService.updateCategory(req.params.id, req.body);
    return success(res, data, '更新成功');
  } catch (err) {
    next(err);
  }
}

async function deleteCategory(req, res, next) {
  try {
    const existing = await serviceService.getCategoryById(req.params.id);
    if (!existing) return fail(res, '分类不存在', 404, 404);
    await serviceService.deleteCategory(req.params.id);
    return success(res, null, '删除成功');
  } catch (err) {
    next(err);
  }
}

async function getPublicList(req, res, next) {
  try {
    const { categoryId, categoryIds, keyword, isHot, page, pageSize, productType, productTypes, appType, appTypes, levelTag, levelTags, tagFilters } = req.query;
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
    const normalizedCategoryIds = typeof categoryIds === 'string'
      ? categoryIds.split(',').map((v) => v.trim()).filter(Boolean)
      : [];
    const data = await serviceService.getPublicServices({
      categoryId,
      categoryIds: normalizedCategoryIds,
      keyword,
      isHot,
      page,
      pageSize,
      productTypes: parseMulti(productTypes, productType),
      appTypes: parseMulti(appTypes, appType),
      levelTags: parseMulti(levelTags, levelTag),
      tagFilters: parseTagFilters(),
    });
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

async function createFilterGroup(req, res, next) {
  try {
    const data = await serviceService.createFilterGroup(req.body);
    return success(res, data, '创建成功');
  } catch (err) {
    next(err);
  }
}

async function updateFilterGroup(req, res, next) {
  try {
    const data = await serviceService.updateFilterGroup(req.params.id, req.body);
    if (!data) return fail(res, '筛选分组不存在', 404, 404);
    return success(res, data, '更新成功');
  } catch (err) {
    next(err);
  }
}

async function deleteFilterGroup(req, res, next) {
  try {
    await serviceService.deleteFilterGroup(req.params.id);
    return success(res, null, '删除成功');
  } catch (err) {
    next(err);
  }
}

async function reorderFilterGroups(req, res, next) {
  try {
    const orderIds = Array.isArray(req.body?.orderIds) ? req.body.orderIds : [];
    await serviceService.reorderFilterGroups(orderIds);
    const data = await serviceService.getFilterTagOptionsAdmin();
    return success(res, data, '分组顺序已更新');
  } catch (err) {
    next(err);
  }
}

async function getAdminList(req, res, next) {
  try {
    const data = await serviceService.getAdminServices(req.query);
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

async function getFilterTagsPublic(req, res, next) {
  try {
    const data = await serviceService.getFilterTagOptionsPublic();
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

async function getFilterTagsAdmin(req, res, next) {
  try {
    const data = await serviceService.getFilterTagOptionsAdmin();
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

async function createFilterTag(req, res, next) {
  try {
    const payload = { ...req.body };
    if (!payload.tag_group && payload.group_key) payload.tag_group = payload.group_key;
    const data = await serviceService.createFilterTag(payload);
    return success(res, data, '创建成功');
  } catch (err) {
    next(err);
  }
}

async function updateFilterTag(req, res, next) {
  try {
    const data = await serviceService.updateFilterTag(req.params.id, req.body);
    if (!data) return fail(res, '标签不存在', 404, 404);
    return success(res, data, '更新成功');
  } catch (err) {
    next(err);
  }
}

async function deleteFilterTag(req, res, next) {
  try {
    await serviceService.deleteFilterTag(req.params.id);
    return success(res, null, '删除成功');
  } catch (err) {
    next(err);
  }
}

async function reorderFilterTags(req, res, next) {
  try {
    const tagGroup = String(req.params.tagGroup || '').trim();
    const orderIds = Array.isArray(req.body?.orderIds) ? req.body.orderIds : [];
    await serviceService.reorderFilterTags(tagGroup, orderIds);
    const data = await serviceService.getFilterTagOptionsAdmin();
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
    const data = await serviceService.getFilterStats({
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

async function getPublicById(req, res, next) {
  try {
    const data = await serviceService.getPublicService(req.params.id);
    if (!data) return fail(res, '服务不存在', 404, 404);
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

async function getAdminById(req, res, next) {
  try {
    const data = await serviceService.getServiceById(req.params.id);
    if (!data) return fail(res, '服务不存在', 404, 404);
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const data = await serviceService.createService(req.body);
    return success(res, data, '创建成功');
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const existing = await serviceService.getServiceById(req.params.id);
    if (!existing) return fail(res, '服务不存在', 404, 404);
    const data = await serviceService.updateService(req.params.id, req.body);
    return success(res, data, '更新成功');
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const existing = await serviceService.getServiceById(req.params.id);
    if (!existing) return fail(res, '服务不存在', 404, 404);
    await serviceService.deleteService(req.params.id);
    return success(res, null, '删除成功');
  } catch (err) {
    next(err);
  }
}

async function reorder(req, res, next) {
  try {
    const orderIds = Array.isArray(req.body?.orderIds) ? req.body.orderIds : [];
    await serviceService.reorderServices(orderIds);
    const data = await serviceService.getAdminServices({ page: 1, pageSize: 50 });
    return success(res, data, '服务顺序已更新');
  } catch (err) {
    next(err);
  }
}

async function reorderServiceCategories(req, res, next) {
  try {
    const orderIds = Array.isArray(req.body?.orderIds) ? req.body.orderIds : [];
    await serviceService.reorderCategories(orderIds);
    const data = await serviceService.getAllCategories();
    return success(res, data, '分类顺序已更新');
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
  reorderServiceCategories,
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
  create,
  update,
  remove,
  reorder,
};
