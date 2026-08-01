const pool = require('../config/db');
const { buildTree } = require('../utils/tree');
const { paginate } = require('../utils/response');
const productFilterService = require('./productFilterService');
const {
  parseSpecOptions,
  normalizeVariants,
  normalizeDetailMedia,
  normalizeSpecDocs,
  deriveSpecTextFromVariants,
} = require('../utils/variantHelpers');

async function getPublicCategoryTree() {
  const [rows] = await pool.query(
    'SELECT id, parent_id, name, en_name, description, icon, sort FROM nuoyuan_product_category WHERE status = 1 ORDER BY sort ASC, id ASC'
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

function parseProductRow(row) {
  let gallery = [];
  try { gallery = row.gallery_json ? JSON.parse(row.gallery_json) : []; } catch { gallery = []; }
  const variants = normalizeVariants(row.variants_json);
  const activeVariants = variants.filter((v) => v.status !== 0);
  const filterTagMap = productFilterService.parseSelectionMapFromRow(row);
  const legacySpecs = parseSpecOptions(row.spec_text);
  return {
    ...row,
    gallery_json: gallery,
    variants,
    detail_media: normalizeDetailMedia(row.detail_media_json),
    spec_docs: normalizeSpecDocs(row.spec_docs_json),
    filter_tags: filterTagMap,
    product_type_list: filterTagMap.product_type || [],
    app_type_list: filterTagMap.app_type || [],
    level_tag_list: filterTagMap.level_tag || [],
    spec_options: activeVariants.length ? activeVariants.map((v) => v.name) : legacySpecs,
  };
}

async function getAllCategories() {
  const [rows] = await pool.query('SELECT * FROM nuoyuan_product_category ORDER BY sort ASC, id ASC');
  return buildTree(rows);
}

async function getCategoryById(id) {
  const [rows] = await pool.query('SELECT * FROM nuoyuan_product_category WHERE id = ?', [id]);
  return rows[0] || null;
}

async function createCategory(data) {
  const { parent_id = 0, name, en_name, description, icon, sort = 0, status = 1 } = data;
  const [result] = await pool.query(
    'INSERT INTO nuoyuan_product_category (parent_id, name, en_name, description, icon, sort, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
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
  await pool.query(`UPDATE nuoyuan_product_category SET ${fields.join(', ')} WHERE id = ?`, values);
  return getCategoryById(id);
}

async function deleteCategory(id) {
  const [children] = await pool.query('SELECT id FROM nuoyuan_product_category WHERE parent_id = ?', [id]);
  if (children.length > 0) {
    const err = new Error('请先删除子分类');
    err.name = 'ValidationError';
    throw err;
  }
  const [products] = await pool.query('SELECT id FROM nuoyuan_product WHERE category_id = ? LIMIT 1', [id]);
  if (products.length > 0) {
    const err = new Error('该分类下存在产品，无法删除');
    err.name = 'ValidationError';
    throw err;
  }
  await pool.query('DELETE FROM nuoyuan_product_category WHERE id = ?', [id]);
}

async function getPublicProducts({
  categoryId,
  categoryIds,
  goodsCodes,
  isHot,
  keyword,
  page = 1,
  pageSize = 12,
  productTypes = [],
  appTypes = [],
  levelTags = [],
  tagFilters = {},
}) {
  const offset = (page - 1) * pageSize;
  const conditions = ['status = 1'];
  const params = [];

  const normalizedCategoryId = (categoryId !== undefined && categoryId !== null)
    ? String(categoryId).trim()
    : '';
  const multiCategoryIds = Array.isArray(categoryIds) && categoryIds.length
    ? categoryIds
    : (typeof normalizedCategoryId === 'string' && normalizedCategoryId.includes(','))
      ? categoryId.split(',').map((v) => v.trim()).filter(Boolean)
      : [];
  if (multiCategoryIds.length) {
    const expandedCategoryIds = await expandNavCategoryIds(multiCategoryIds);
    if (expandedCategoryIds.length) {
      conditions.push(`category_id IN (${expandedCategoryIds.map(() => '?').join(',')})`);
      params.push(...expandedCategoryIds);
    }
  } else if (normalizedCategoryId) {
    const expandedCategoryIds = await expandNavCategoryIds([normalizedCategoryId]);
    if (expandedCategoryIds.length > 1) {
      conditions.push(`category_id IN (${expandedCategoryIds.map(() => '?').join(',')})`);
      params.push(...expandedCategoryIds);
    } else {
      conditions.push('category_id = ?');
      params.push(normalizedCategoryId);
    }
  }
  if (Array.isArray(goodsCodes) && goodsCodes.length) {
    conditions.push(`goods_code IN (${goodsCodes.map(() => '?').join(',')})`);
    params.push(...goodsCodes);
  }
  const mergedTagFilters = {
    ...productFilterService.normalizeFilterMap(tagFilters),
    product_type: productFilterService.normalizeMultiSelect(productTypes),
    app_type: productFilterService.normalizeMultiSelect(appTypes),
    level_tag: productFilterService.normalizeMultiSelect(levelTags),
  };
  productFilterService.addTagFilterConditions(conditions, params, mergedTagFilters);
  if (isHot !== undefined && isHot !== '') {
    conditions.push('is_hot = ?');
    params.push(isHot);
  }
  if (keyword) {
    conditions.push('(name LIKE ? OR en_name LIKE ? OR short_desc LIKE ? OR goods_code LIKE ? OR product_type LIKE ? OR app_type LIKE ? OR level_tag LIKE ?)');
    params.push(
      `%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`,
      `%${keyword}%`, `%${keyword}%`, `%${keyword}%`
    );
  }

  const where = `WHERE ${conditions.join(' AND ')}`;
  const [countRows] = await pool.query(`SELECT COUNT(*) AS total FROM nuoyuan_product ${where}`, params);
  const total = countRows[0].total;

  const selectFields = [
    'id', 'product_code', 'goods_code', 'category_id', 'name', 'en_name', 'short_desc', 'spec_text',
    'cover_image', 'video_url', 'is_hot', 'sort', 'view_count',
    'product_type', 'app_type', 'level_tag', 'filter_tags_json',
    'variants_json',
  ];
  const [rows] = await pool.query(
    `SELECT ${selectFields.join(', ')} FROM nuoyuan_product ${where} ORDER BY sort ASC, id DESC LIMIT ? OFFSET ?`,
    [...params, parseInt(pageSize, 10), offset]
  );
  return paginate(rows.map(parseProductRow), total, page, pageSize);
}

async function getAdminProducts({ categoryId, status, keyword, productType, appType, levelTag, page = 1, pageSize = 20 }) {
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
  const mergedTagFilters = {
    product_type: productFilterService.normalizeMultiSelect(productType),
    app_type: productFilterService.normalizeMultiSelect(appType),
    level_tag: productFilterService.normalizeMultiSelect(levelTag),
  };
  productFilterService.addTagFilterConditions(conditions, params, mergedTagFilters);
  if (keyword) {
    conditions.push('(name LIKE ? OR en_name LIKE ? OR short_desc LIKE ? OR goods_code LIKE ? OR product_type LIKE ? OR app_type LIKE ? OR level_tag LIKE ?)');
    params.push(
      `%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`,
      `%${keyword}%`, `%${keyword}%`, `%${keyword}%`
    );
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const [countRows] = await pool.query(`SELECT COUNT(*) AS total FROM nuoyuan_product ${where}`, params);
  const total = countRows[0].total;

  const [rows] = await pool.query(
    `SELECT * FROM nuoyuan_product ${where} ORDER BY sort ASC, id DESC LIMIT ? OFFSET ?`,
    [...params, parseInt(pageSize, 10), offset]
  );

  return paginate(rows.map(parseProductRow), total, page, pageSize);
}

async function getPublicProduct(id) {
  const [rows] = await pool.query(
    'SELECT * FROM nuoyuan_product WHERE id = ? AND status = 1',
    [id]
  );
  if (rows[0]) {
    await pool.query('UPDATE nuoyuan_product SET view_count = view_count + 1 WHERE id = ?', [id]);
    rows[0].view_count += 1;
  }
  if (!rows[0]) return null;
  return parseProductRow(rows[0]);
}

async function getProductById(id) {
  const [rows] = await pool.query('SELECT * FROM nuoyuan_product WHERE id = ?', [id]);
  if (!rows[0]) return null;
  return parseProductRow(rows[0]);
}

async function getProductByCode(productCode) {
  const [rows] = await pool.query(
    'SELECT id, product_code, goods_code, name, cover_image FROM nuoyuan_product WHERE product_code = ? LIMIT 1',
    [productCode]
  );
  return rows[0] || null;
}

async function createProduct(data) {
  const {
    category_id, name, en_name, short_desc, core_advantage, content,
    cover_image, banner_image, sort = 0, is_hot = 0, status = 1,
    goods_code, spec_text, detail_richtext, gallery_json, video_url,
    product_type, app_type, level_tag, filter_tags,
    variants, variants_json, detail_media, detail_media_json, spec_docs, spec_docs_json,
  } = data;
  const normalizedMap = productFilterService.normalizeFilterMap({
    ...productFilterService.normalizeFilterMap(filter_tags),
    product_type,
    app_type,
    level_tag,
  });
  await productFilterService.validateRequiredSelections(normalizedMap);
  const normalizedVariants = normalizeVariants(variants !== undefined ? variants : variants_json);
  const normalizedMedia = normalizeDetailMedia(detail_media !== undefined ? detail_media : detail_media_json);
  const normalizedDocs = normalizeSpecDocs(spec_docs !== undefined ? spec_docs : spec_docs_json);
  const syncedSpecText = normalizedVariants.length
    ? deriveSpecTextFromVariants(normalizedVariants)
    : (spec_text || null);
  const [nextRows] = await pool.query('SELECT IFNULL(MAX(id), 0) + 1 AS nextId FROM nuoyuan_product');
  const productCode = String(nextRows[0].nextId).padStart(5, '0');
  const [result] = await pool.query(
    `INSERT INTO nuoyuan_product (
      product_code, goods_code, category_id, name, en_name, short_desc, spec_text, variants_json,
      core_advantage, content, detail_richtext, detail_media_json, spec_docs_json,
      cover_image, banner_image, gallery_json, video_url, product_type, app_type, level_tag, filter_tags_json, sort, is_hot, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      productCode,
      goods_code || null,
      category_id,
      name,
      en_name || null,
      short_desc,
      syncedSpecText,
      JSON.stringify(normalizedVariants),
      core_advantage || null,
      content || null,
      detail_richtext || null,
      JSON.stringify(normalizedMedia),
      JSON.stringify(normalizedDocs),
      cover_image || null,
      banner_image || null,
      JSON.stringify(gallery_json || []),
      video_url || null,
      (normalizedMap.product_type || []).join(','),
      (normalizedMap.app_type || []).join(','),
      (normalizedMap.level_tag || []).join(','),
      JSON.stringify(normalizedMap),
      sort,
      is_hot,
      status,
    ]
  );
  return getProductById(result.insertId);
}

async function updateProduct(id, data) {
  const fields = [];
  const values = [];
  const allowed = ['category_id', 'name', 'en_name', 'short_desc', 'spec_text', 'core_advantage', 'content', 'detail_richtext', 'cover_image', 'banner_image', 'video_url', 'goods_code', 'sort', 'is_hot', 'status'];
  if (data.gallery_json !== undefined) {
    fields.push('gallery_json = ?');
    values.push(JSON.stringify(data.gallery_json || []));
  }
  const hasVariantInput = data.variants !== undefined || data.variants_json !== undefined;
  if (hasVariantInput) {
    const normalizedVariants = normalizeVariants(data.variants !== undefined ? data.variants : data.variants_json);
    fields.push('variants_json = ?');
    values.push(JSON.stringify(normalizedVariants));
    if (data.spec_text === undefined) {
      fields.push('spec_text = ?');
      values.push(deriveSpecTextFromVariants(normalizedVariants) || null);
    }
  }
  if (data.detail_media !== undefined || data.detail_media_json !== undefined) {
    fields.push('detail_media_json = ?');
    values.push(JSON.stringify(normalizeDetailMedia(data.detail_media !== undefined ? data.detail_media : data.detail_media_json)));
  }
  if (data.spec_docs !== undefined || data.spec_docs_json !== undefined) {
    fields.push('spec_docs_json = ?');
    values.push(JSON.stringify(normalizeSpecDocs(data.spec_docs !== undefined ? data.spec_docs : data.spec_docs_json)));
  }
  const hasSelectionChange = data.filter_tags !== undefined
    || data.product_type !== undefined
    || data.app_type !== undefined
    || data.level_tag !== undefined;
  if (hasSelectionChange) {
    const existing = await getProductById(id);
    const merged = productFilterService.normalizeFilterMap({
      ...(existing?.filter_tags || {}),
      ...(data.filter_tags || {}),
      ...(data.product_type !== undefined ? { product_type: data.product_type } : {}),
      ...(data.app_type !== undefined ? { app_type: data.app_type } : {}),
      ...(data.level_tag !== undefined ? { level_tag: data.level_tag } : {}),
    });
    await productFilterService.validateRequiredSelections(merged);
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
  if (fields.length === 0) return getProductById(id);
  values.push(id);
  await pool.query(`UPDATE nuoyuan_product SET ${fields.join(', ')} WHERE id = ?`, values);
  return getProductById(id);
}

async function deleteProduct(id) {
  await pool.query('DELETE FROM nuoyuan_product WHERE id = ?', [id]);
}

async function reorderProducts(orderIds = []) {
  // 先写入临时编号，避免 product_code 唯一索引冲突
  for (let i = 0; i < orderIds.length; i += 1) {
    const tempCode = `TMP${String(Math.min(i + 1, 99999)).padStart(5, '0')}`;
    await pool.query('UPDATE nuoyuan_product SET sort = ?, product_code = ? WHERE id = ?', [i, tempCode, orderIds[i]]);
  }
  // 再写入正式编号 00001~99999
  for (let i = 0; i < orderIds.length; i += 1) {
    const code = String(Math.min(i + 1, 99999)).padStart(5, '0');
    await pool.query('UPDATE nuoyuan_product SET product_code = ? WHERE id = ?', [code, orderIds[i]]);
  }
}

async function reorderCategories(orderIds = []) {
  for (let i = 0; i < orderIds.length; i += 1) {
    await pool.query('UPDATE nuoyuan_product_category SET sort = ? WHERE id = ?', [i, orderIds[i]]);
  }
}

async function getFilterTagOptionsPublic() {
  return productFilterService.getTagOptions();
}

async function getFilterTagOptionsAdmin() {
  return productFilterService.getTagOptionsAdmin();
}

async function createFilterTag(data) {
  return productFilterService.createTag(data);
}

async function updateFilterTag(id, data) {
  return productFilterService.updateTag(id, data);
}

async function deleteFilterTag(id) {
  return productFilterService.deleteTag(id);
}

async function reorderFilterTags(tagGroup, orderIds) {
  return productFilterService.reorderTags(tagGroup, orderIds);
}

async function getFilterStats(params) {
  const map = productFilterService.normalizeFilterMap(params?.tagFilters || {});
  if ((params?.productTypes || []).length) map.product_type = params.productTypes;
  if ((params?.appTypes || []).length) map.app_type = params.appTypes;
  if ((params?.levelTags || []).length) map.level_tag = params.levelTags;
  return productFilterService.getFilterStat({
    keyword: params?.keyword || '',
    tagFilters: map,
  });
}

async function createFilterGroup(data) {
  return productFilterService.createGroup(data);
}

async function updateFilterGroup(id, data) {
  return productFilterService.updateGroup(id, data);
}

async function deleteFilterGroup(id) {
  return productFilterService.deleteGroup(id);
}

async function reorderFilterGroups(orderIds) {
  return productFilterService.reorderGroups(orderIds);
}

module.exports = {
  getPublicCategoryTree,
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getPublicProducts,
  getAdminProducts,
  getPublicProduct,
  getProductById,
  getProductByCode,
  createProduct,
  updateProduct,
  deleteProduct,
  reorderProducts,
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
