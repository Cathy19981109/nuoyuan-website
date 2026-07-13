const pool = require('../config/db');
const { buildTree } = require('../utils/tree');
const { paginate } = require('../utils/response');
const serviceFilterService = require('./serviceFilterService');

async function getPublicCategoryTree() {
  const [rows] = await pool.query(
    'SELECT id, parent_id, name, en_name, description, icon, sort FROM nuoyuan_service_category WHERE status = 1 ORDER BY sort ASC, id ASC'
  );
  return buildTree(rows);
}

async function expandNavCategoryIds(rawIds = []) {
  const seed = Array.from(new Set((rawIds || []).map((v) => Number(v)).filter((v) => Number.isInteger(v) && v > 0)));
  if (!seed.length) return [];
  const [rows] = await pool.query('SELECT id, parent_id FROM nuoyuan_nav');
  if (!rows.length) return seed;
  const childrenMap = new Map();
  rows.forEach((row) => {
    const pid = Number(row.parent_id || 0);
    if (!childrenMap.has(pid)) childrenMap.set(pid, []);
    childrenMap.get(pid).push(Number(row.id));
  });
  const visited = new Set();
  const queue = [...seed];
  while (queue.length) {
    const current = queue.shift();
    if (visited.has(current)) continue;
    visited.add(current);
    const children = childrenMap.get(current) || [];
    children.forEach((child) => {
      if (!visited.has(child)) queue.push(child);
    });
  }
  return Array.from(visited);
}

async function getAllCategories() {
  const [rows] = await pool.query('SELECT * FROM nuoyuan_service_category ORDER BY sort ASC, id ASC');
  return buildTree(rows);
}

async function getCategoryById(id) {
  const [rows] = await pool.query('SELECT * FROM nuoyuan_service_category WHERE id = ?', [id]);
  return rows[0] || null;
}

async function createCategory(data) {
  const { parent_id = 0, name, en_name, description, icon, sort = 0, status = 1 } = data;
  const [result] = await pool.query(
    'INSERT INTO nuoyuan_service_category (parent_id, name, en_name, description, icon, sort, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [parent_id, name, en_name || null, description || null, icon || null, sort, status]
  );
  return getCategoryById(result.insertId);
}

async function updateCategory(id, data) {
  const fields = [];
  const values = [];
  const allowed = ['parent_id', 'name', 'en_name', 'description', 'icon', 'sort', 'status'];
  allowed.forEach((key) => {
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(data[key]);
    }
  });
  if (fields.length === 0) return getCategoryById(id);
  values.push(id);
  await pool.query(`UPDATE nuoyuan_service_category SET ${fields.join(', ')} WHERE id = ?`, values);
  return getCategoryById(id);
}

async function deleteCategory(id) {
  const [children] = await pool.query('SELECT id FROM nuoyuan_service_category WHERE parent_id = ?', [id]);
  if (children.length > 0) {
    const err = new Error('请先删除子分类');
    err.name = 'ValidationError';
    throw err;
  }
  const [services] = await pool.query('SELECT id FROM nuoyuan_service WHERE category_id = ? LIMIT 1', [id]);
  if (services.length > 0) {
    const err = new Error('该分类下存在服务，无法删除');
    err.name = 'ValidationError';
    throw err;
  }
  await pool.query('DELETE FROM nuoyuan_service_category WHERE id = ?', [id]);
}

async function getPublicServices({
  categoryId,
  categoryIds,
  keyword,
  page = 1,
  pageSize = 20,
  productTypes = [],
  appTypes = [],
  levelTags = [],
  tagFilters = {},
}) {
  const offset = (page - 1) * pageSize;
  const conditions = ['status = 1'];
  const params = [];

  const multiCategoryIds = Array.isArray(categoryIds) && categoryIds.length
    ? categoryIds
    : (typeof categoryId === 'string' && categoryId.includes(','))
      ? categoryId.split(',').map((v) => v.trim()).filter(Boolean)
      : [];
  if (multiCategoryIds.length) {
    const expandedCategoryIds = await expandNavCategoryIds(multiCategoryIds);
    if (expandedCategoryIds.length) {
      conditions.push(`category_id IN (${expandedCategoryIds.map(() => '?').join(',')})`);
      params.push(...expandedCategoryIds);
    }
  } else if (categoryId) {
    const expandedCategoryIds = await expandNavCategoryIds([categoryId]);
    if (expandedCategoryIds.length > 1) {
      conditions.push(`category_id IN (${expandedCategoryIds.map(() => '?').join(',')})`);
      params.push(...expandedCategoryIds);
    } else {
      conditions.push('category_id = ?');
      params.push(categoryId);
    }
  }

  if (keyword) {
    conditions.push('(name LIKE ? OR short_desc LIKE ? OR goods_code LIKE ?)');
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }
  const mergedTagFilters = {
    ...serviceFilterService.normalizeFilterMap(tagFilters),
    product_type: serviceFilterService.normalizeMultiSelect(productTypes),
    app_type: serviceFilterService.normalizeMultiSelect(appTypes),
    level_tag: serviceFilterService.normalizeMultiSelect(levelTags),
  };
  serviceFilterService.addTagFilterConditions(conditions, params, mergedTagFilters);

  const where = `WHERE ${conditions.join(' AND ')}`;
  const [countRows] = await pool.query(`SELECT COUNT(*) AS total FROM nuoyuan_service ${where}`, params);
  const total = countRows[0].total;

  const selectFields = ['id', 'service_code AS product_code', 'goods_code', 'category_id', 'name', 'en_name', 'short_desc', 'spec_text', 'cover_image', 'video_url', 'is_hot', 'sort', 'view_count', 'product_type', 'app_type', 'level_tag', 'filter_tags_json'];
  const [rows] = await pool.query(
    `SELECT ${selectFields.join(', ')}
     FROM nuoyuan_service ${where} ORDER BY sort ASC, id DESC LIMIT ? OFFSET ?`,
    [...params, parseInt(pageSize, 10), offset]
  );

  return paginate(rows.map((row) => ({
    ...row,
    filter_tags: serviceFilterService.parseSelectionMapFromRow(row),
    product_type_list: serviceFilterService.parseSelectionMapFromRow(row).product_type || [],
    app_type_list: serviceFilterService.parseSelectionMapFromRow(row).app_type || [],
    level_tag_list: serviceFilterService.parseSelectionMapFromRow(row).level_tag || [],
  })), total, page, pageSize);
}

async function getAdminServices({ categoryId, status, keyword, productType, appType, levelTag, page = 1, pageSize = 20 }) {
  const offset = (page - 1) * pageSize;
  const conditions = [];
  const params = [];

  if (categoryId) {
    conditions.push('category_id = ?');
    params.push(categoryId);
  }
  if (status !== undefined && status !== '') {
    conditions.push('status = ?');
    params.push(status);
  }
  if (keyword) {
    conditions.push('(name LIKE ? OR short_desc LIKE ? OR goods_code LIKE ?)');
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }
  const mergedTagFilters = {
    product_type: serviceFilterService.normalizeMultiSelect(productType),
    app_type: serviceFilterService.normalizeMultiSelect(appType),
    level_tag: serviceFilterService.normalizeMultiSelect(levelTag),
  };
  serviceFilterService.addTagFilterConditions(conditions, params, mergedTagFilters);

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const [countRows] = await pool.query(`SELECT COUNT(*) AS total FROM nuoyuan_service ${where}`, params);
  const total = countRows[0].total;

  const selectFields = [
    'id', 'service_code AS product_code', 'goods_code', 'category_id', 'name', 'en_name', 'short_desc', 'spec_text', 'core_advantage',
    'content', 'detail_richtext', 'cover_image', 'banner_image', 'gallery_json', 'video_url', 'product_type', 'app_type', 'level_tag', 'filter_tags_json', 'sort', 'is_hot', 'status', 'view_count', 'created_at', 'updated_at',
  ];
  const [rows] = await pool.query(
    `SELECT ${selectFields.join(', ')}
     FROM nuoyuan_service ${where} ORDER BY sort ASC, id DESC LIMIT ? OFFSET ?`,
    [...params, parseInt(pageSize, 10), offset]
  );

  return paginate(rows.map((row) => {
    const map = serviceFilterService.parseSelectionMapFromRow(row);
    return {
      ...row,
      gallery_json: parseGallery(row.gallery_json),
      filter_tags: map,
      product_type_list: map.product_type || [],
      app_type_list: map.app_type || [],
      level_tag_list: map.level_tag || [],
    };
  }), total, page, pageSize);
}

function parseGallery(raw) {
  try {
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function getPublicService(id) {
  const [rows] = await pool.query(
    `SELECT
      id, service_code AS product_code, goods_code, category_id, name, en_name, short_desc, spec_text, core_advantage,
      content, detail_richtext, cover_image, banner_image, gallery_json, video_url, product_type, app_type, level_tag, filter_tags_json, sort, is_hot, status, view_count, created_at, updated_at
     FROM nuoyuan_service WHERE id = ? AND status = 1`,
    [id]
  );
  if (rows[0]) {
    await pool.query('UPDATE nuoyuan_service SET view_count = view_count + 1 WHERE id = ?', [id]);
    rows[0].view_count += 1;
  }
  if (!rows[0]) return null;
  const map = serviceFilterService.parseSelectionMapFromRow(rows[0]);
  return {
    ...rows[0],
    gallery_json: parseGallery(rows[0].gallery_json),
    filter_tags: map,
    product_type_list: map.product_type || [],
    app_type_list: map.app_type || [],
    level_tag_list: map.level_tag || [],
  };
}

async function getServiceById(id) {
  const [rows] = await pool.query(
    `SELECT
      id, service_code AS product_code, goods_code, category_id, name, en_name, short_desc, spec_text, core_advantage,
      content, detail_richtext, cover_image, banner_image, gallery_json, video_url, product_type, app_type, level_tag, filter_tags_json, sort, is_hot, status, view_count, created_at, updated_at
     FROM nuoyuan_service WHERE id = ?`,
    [id]
  );
  if (!rows[0]) return null;
  const map = serviceFilterService.parseSelectionMapFromRow(rows[0]);
  return {
    ...rows[0],
    gallery_json: parseGallery(rows[0].gallery_json),
    filter_tags: map,
    product_type_list: map.product_type || [],
    app_type_list: map.app_type || [],
    level_tag_list: map.level_tag || [],
  };
}

async function createService(data) {
  const {
    category_id, name, en_name, short_desc, core_advantage, content,
    cover_image, banner_image, sort = 0, is_hot = 0, status = 1,
    goods_code, spec_text, detail_richtext, gallery_json, video_url,
    product_type, app_type, level_tag, filter_tags,
  } = data;
  const normalizedMap = serviceFilterService.normalizeFilterMap({
    ...serviceFilterService.normalizeFilterMap(filter_tags),
    product_type,
    app_type,
    level_tag,
  });
  await serviceFilterService.validateRequiredSelections(normalizedMap);
  const [nextRows] = await pool.query('SELECT IFNULL(MAX(id), 0) + 1 AS nextId FROM nuoyuan_service');
  const serviceCode = String(nextRows[0].nextId).padStart(5, '0');
  const cols = ['service_code', 'goods_code', 'category_id', 'name', 'en_name', 'short_desc', 'spec_text', 'core_advantage', 'content', 'detail_richtext', 'cover_image', 'banner_image', 'gallery_json', 'video_url', 'product_type', 'app_type', 'level_tag', 'filter_tags_json', 'sort', 'is_hot', 'status'];
  const vals = [serviceCode, goods_code || null, category_id, name, en_name || null, short_desc, spec_text || null, core_advantage || null, content || null, detail_richtext || null, cover_image || null, banner_image || null, JSON.stringify(gallery_json || []), video_url || null, (normalizedMap.product_type || []).join(','), (normalizedMap.app_type || []).join(','), (normalizedMap.level_tag || []).join(','), JSON.stringify(normalizedMap), sort, is_hot, status];
  const [result] = await pool.query(
    `INSERT INTO nuoyuan_service (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`,
    vals
  );
  return getServiceById(result.insertId);
}

async function updateService(id, data) {
  const fields = [];
  const values = [];
  const allowed = ['category_id', 'name', 'en_name', 'short_desc', 'spec_text', 'core_advantage', 'content', 'detail_richtext', 'cover_image', 'banner_image', 'video_url', 'goods_code', 'sort', 'is_hot', 'status'];
  if (data.gallery_json !== undefined) {
    fields.push('gallery_json = ?');
    values.push(JSON.stringify(data.gallery_json || []));
  }
  const hasSelectionChange = data.filter_tags !== undefined
    || data.product_type !== undefined
    || data.app_type !== undefined
    || data.level_tag !== undefined;
  if (hasSelectionChange) {
    const existing = await getServiceById(id);
    const merged = serviceFilterService.normalizeFilterMap({
      ...(existing?.filter_tags || {}),
      ...(data.filter_tags || {}),
      ...(data.product_type !== undefined ? { product_type: data.product_type } : {}),
      ...(data.app_type !== undefined ? { app_type: data.app_type } : {}),
      ...(data.level_tag !== undefined ? { level_tag: data.level_tag } : {}),
    });
    await serviceFilterService.validateRequiredSelections(merged);
    fields.push('product_type = ?');
    values.push((merged.product_type || []).join(','));
    fields.push('app_type = ?');
    values.push((merged.app_type || []).join(','));
    fields.push('level_tag = ?');
    values.push((merged.level_tag || []).join(','));
    fields.push('filter_tags_json = ?');
    values.push(JSON.stringify(merged));
  }
  allowed.forEach((key) => {
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(data[key]);
    }
  });
  if (fields.length === 0) return getServiceById(id);
  values.push(id);
  await pool.query(`UPDATE nuoyuan_service SET ${fields.join(', ')} WHERE id = ?`, values);
  return getServiceById(id);
}

async function deleteService(id) {
  await pool.query('DELETE FROM nuoyuan_service WHERE id = ?', [id]);
}

async function reorderServices(orderIds = []) {
  for (let i = 0; i < orderIds.length; i += 1) {
    const code = String(Math.min(i + 1, 99999)).padStart(5, '0');
    await pool.query('UPDATE nuoyuan_service SET sort = ?, service_code = ? WHERE id = ?', [i, code, orderIds[i]]);
  }
}

async function reorderCategories(orderIds = []) {
  for (let i = 0; i < orderIds.length; i += 1) {
    await pool.query('UPDATE nuoyuan_service_category SET sort = ? WHERE id = ?', [i, orderIds[i]]);
  }
}

async function getFilterTagOptionsPublic() {
  return serviceFilterService.getTagOptions();
}

async function getFilterTagOptionsAdmin() {
  return serviceFilterService.getTagOptionsAdmin();
}

async function createFilterTag(data) {
  return serviceFilterService.createTag(data);
}

async function updateFilterTag(id, data) {
  return serviceFilterService.updateTag(id, data);
}

async function deleteFilterTag(id) {
  return serviceFilterService.deleteTag(id);
}

async function reorderFilterTags(tagGroup, orderIds) {
  return serviceFilterService.reorderTags(tagGroup, orderIds);
}

async function getFilterStats(params) {
  const map = serviceFilterService.normalizeFilterMap(params?.tagFilters || {});
  if ((params?.productTypes || []).length) map.product_type = params.productTypes;
  if ((params?.appTypes || []).length) map.app_type = params.appTypes;
  if ((params?.levelTags || []).length) map.level_tag = params.levelTags;
  return serviceFilterService.getFilterStat({
    keyword: params?.keyword || '',
    tagFilters: map,
  });
}

async function createFilterGroup(data) {
  return serviceFilterService.createGroup(data);
}

async function updateFilterGroup(id, data) {
  return serviceFilterService.updateGroup(id, data);
}

async function deleteFilterGroup(id) {
  return serviceFilterService.deleteGroup(id);
}

async function reorderFilterGroups(orderIds) {
  return serviceFilterService.reorderGroups(orderIds);
}

module.exports = {
  getPublicCategoryTree,
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getPublicServices,
  getAdminServices,
  getPublicService,
  getServiceById,
  createService,
  updateService,
  deleteService,
  reorderServices,
  reorderCategories,
  getFilterTagOptionsPublic,
  getFilterTagOptionsAdmin,
  createFilterTag,
  updateFilterTag,
  deleteFilterTag,
  reorderFilterTags,
  createFilterGroup,
  updateFilterGroup,
  deleteFilterGroup,
  reorderFilterGroups,
  getFilterStats,
};
