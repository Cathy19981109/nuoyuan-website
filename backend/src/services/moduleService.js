const pool = require('../config/db');
const { paginate } = require('../utils/response');

const recycleColumnCache = {
  loaded: false,
  sort: false,
  front_position: false,
};

const parentIdColumnCache = {
  loaded: false,
  exists: false,
};

async function ensureRecycleColumnMeta() {
  if (recycleColumnCache.loaded) return recycleColumnCache;
  const [rows] = await pool.query(
    `SELECT COLUMN_NAME
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'nuoyuan_module_recycle'`
  );
  const names = new Set((rows || []).map((r) => r.COLUMN_NAME));
  recycleColumnCache.sort = names.has('sort');
  recycleColumnCache.front_position = names.has('front_position');
  recycleColumnCache.loaded = true;
  return recycleColumnCache;
}

async function ensureParentIdColumn() {
  if (parentIdColumnCache.loaded) return parentIdColumnCache.exists;
  const [rows] = await pool.query(
    `SELECT COLUMN_NAME
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'nuoyuan_page_module'
       AND COLUMN_NAME = 'parent_id'`
  );
  if (rows && rows.length) {
    parentIdColumnCache.exists = true;
    parentIdColumnCache.loaded = true;
    return true;
  }
  try {
    await pool.query(
      `ALTER TABLE nuoyuan_page_module
       ADD COLUMN parent_id bigint unsigned NOT NULL DEFAULT 0 COMMENT '父模块ID，0=顶级' AFTER page_key,
       ADD KEY idx_page_parent (page_key, parent_id)`
    );
    parentIdColumnCache.exists = true;
  } catch (err) {
    // Concurrent migration or already exists
    parentIdColumnCache.exists = true;
  }
  parentIdColumnCache.loaded = true;
  return parentIdColumnCache.exists;
}

function getTemplatesByPage(pageKey) {
  const common = [
    { code: 'sub_nav_group', name: '子导航模块', imageRule: '容器模块：在内部添加子模块；子模块 1 张为图文，2 张及以上自动轮播' },
    { code: 'full_width_single_image', name: '全屏宽幅单图', imageRule: '16:9，1920x720，png/jpg/webp，<=50MB（仅单图）' },
    { code: 'image_text_split', name: '图文分栏模块', imageRule: '图上/图下：16:9 1920x720；图左/图右/图内：4:3 1200x900；png/jpg/webp，<=50MB' },
    { code: 'multi_image_carousel', name: '多图轮播模块', imageRule: '仅图片、无文字；须统一长方形 16:9（建议 1920x720），png/jpg/webp，<=50MB，至少 2 张' },
    { code: 'single_video_module', name: '单视频模块', imageRule: '16:9，mp4，<=1GB（仅单视频）' },
    { code: 'image_jump_button', name: '图文跳转按钮模块', imageRule: '配图建议16:9 1920x720，png/jpg/webp，<=50MB' },
  ];
  return common;
}

function parseJsonSafe(v, fallback) {
  if (!v) return fallback;
  if (typeof v === 'object') return v;
  try {
    return JSON.parse(v);
  } catch {
    return fallback;
  }
}

function countValidImages(list) {
  const rows = Array.isArray(list) ? list : [];
  return rows.filter((item) => {
    if (!item) return false;
    if (typeof item === 'string') return !!item.trim();
    return !!(item.url && String(item.url).trim());
  }).length;
}

function resolveModuleTemplate(data = {}) {
  const template = data.module_template || '';
  if (template === 'sub_nav_group') return 'sub_nav_group';
  const parentId = Number(data.parent_id || 0);
  if (parentId > 0) {
    const images = Array.isArray(data.image_list_json)
      ? data.image_list_json
      : parseJsonSafe(data.image_list_json, []);
    return countValidImages(images) >= 2 ? 'multi_image_carousel' : 'image_text_split';
  }
  return template;
}

/** 独立多图轮播：仅图片、至少 2 张；清空正文 */
function applyStandaloneCarouselRules(data = {}) {
  const parentId = Number(data.parent_id || 0);
  const template = resolveModuleTemplate(data);
  if (parentId > 0 || template !== 'multi_image_carousel') return data;
  const images = Array.isArray(data.image_list_json)
    ? data.image_list_json
    : parseJsonSafe(data.image_list_json, []);
  if (countValidImages(images) < 2) {
    const err = new Error('多图轮播至少上传 2 张统一 16:9 长方形图片');
    err.status = 400;
    throw err;
  }
  return {
    ...data,
    module_template: 'multi_image_carousel',
    body_text: '',
    layout_mode: data.layout_mode || 'bottom',
  };
}

function toModuleForRead(row) {
  const legacyData = parseJsonSafe(row.module_data, {});
  return {
    ...row,
    parent_id: Number(row.parent_id || 0),
    layout_mode: row.layout_mode || legacyData.layout_mode || null,
    video_url: row.video_url || legacyData.video_url || null,
    jump_type: row.jump_type || legacyData.jump_type || null,
    jump_product_code: row.jump_product_code || legacyData.jump_product_code || null,
    image_list_json: parseJsonSafe(row.image_list_json, legacyData.images || []),
    card_items_json: parseJsonSafe(row.card_items_json, legacyData.cards || []),
    extra_json: parseJsonSafe(row.extra_json, legacyData.extra || {}),
  };
}

function toModuleForWrite(data) {
  const imageList = Array.isArray(data.image_list_json) ? data.image_list_json : [];
  const cardItems = Array.isArray(data.card_items_json) ? data.card_items_json : [];
  const extra = data.extra_json && typeof data.extra_json === 'object' ? data.extra_json : {};
  const autoData = {
    main_title: data.main_title || '',
    sub_title: data.sub_title || '',
    body_text: data.body_text || '',
    layout_mode: data.layout_mode || '',
    images: imageList,
    video_url: data.video_url || '',
    jump_type: data.jump_type || '',
    jump_product_code: data.jump_product_code || '',
    link_url: data.link_url || '',
    table_text: data.table_text || '',
    qa_question: data.qa_question || '',
    qa_answer: data.qa_answer || '',
    cards: cardItems,
    extra,
  };
  return {
    main_title: data.main_title || null,
    sub_title: data.sub_title || null,
    body_text: data.body_text || null,
    layout_mode: data.layout_mode || null,
    image_list_json: JSON.stringify(imageList),
    video_url: data.video_url || null,
    jump_type: data.jump_type || null,
    jump_product_code: data.jump_product_code || null,
    link_url: data.link_url || null,
    table_text: data.table_text || null,
    qa_question: data.qa_question || null,
    qa_answer: data.qa_answer || null,
    card_items_json: JSON.stringify(cardItems),
    extra_json: JSON.stringify(extra),
    module_data: JSON.stringify(autoData),
  };
}

async function listModules(pageKey, includeHidden = false) {
  await ensureParentIdColumn();
  const condition = includeHidden ? '' : 'AND status = 1';
  const [rows] = await pool.query(
    `SELECT * FROM nuoyuan_page_module WHERE page_key = ? ${condition} ORDER BY parent_id ASC, sort ASC, module_no ASC`,
    [pageKey]
  );
  return rows.map(toModuleForRead);
}

async function getModuleById(id) {
  await ensureParentIdColumn();
  const [rows] = await pool.query('SELECT * FROM nuoyuan_page_module WHERE id = ?', [id]);
  return rows[0] ? toModuleForRead(rows[0]) : null;
}

async function getNextModuleNo(pageKey) {
  const [rows] = await pool.query('SELECT IFNULL(MAX(module_no), 0) AS maxNo FROM nuoyuan_page_module WHERE page_key = ?', [pageKey]);
  return rows[0].maxNo + 1;
}

async function createModule(data, adminId) {
  await ensureParentIdColumn();
  const moduleNo = await getNextModuleNo(data.page_key);
  const parentId = Number(data.parent_id || 0);
  const normalized = applyStandaloneCarouselRules({ ...data, parent_id: parentId });
  const moduleTemplate = resolveModuleTemplate(normalized);
  const structured = toModuleForWrite(normalized);
  const [result] = await pool.query(
    `INSERT INTO nuoyuan_page_module
    (page_key, parent_id, module_no, module_name, module_template, main_title, sub_title, body_text, layout_mode, image_list_json, video_url, link_url, jump_type, jump_product_code, table_text, qa_question, qa_answer, card_items_json, extra_json, front_position, module_data, sort, status, created_admin_id, updated_admin_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      normalized.page_key,
      parentId,
      moduleNo,
      normalized.module_name,
      moduleTemplate,
      structured.main_title,
      structured.sub_title,
      structured.body_text,
      structured.layout_mode,
      structured.image_list_json,
      structured.video_url,
      structured.link_url,
      structured.jump_type,
      structured.jump_product_code,
      structured.table_text,
      structured.qa_question,
      structured.qa_answer,
      structured.card_items_json,
      structured.extra_json,
      normalized.front_position || null,
      structured.module_data,
      normalized.sort || 0,
      normalized.status === 0 ? 0 : 1,
      adminId || null,
      adminId || null,
    ]
  );
  return getModuleById(result.insertId);
}

async function updateModule(id, data, adminId) {
  await ensureParentIdColumn();
  const current = await getModuleById(id);
  if (!current) return null;

  const fields = [];
  const values = [];
  const allowed = ['module_name', 'front_position', 'status'];
  allowed.forEach((key) => {
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(data[key]);
    }
  });
  if (data.parent_id !== undefined) {
    fields.push('parent_id = ?');
    values.push(Number(data.parent_id || 0));
  }
  if (data.sort !== undefined) {
    fields.push('sort = ?');
    values.push(data.sort);
  }

  const mergedParentId = data.parent_id !== undefined ? Number(data.parent_id || 0) : Number(current.parent_id || 0);
  const structuredInputKeys = [
    'main_title',
    'sub_title',
    'body_text',
    'layout_mode',
    'image_list_json',
    'video_url',
    'link_url',
    'jump_type',
    'jump_product_code',
    'table_text',
    'qa_question',
    'qa_answer',
    'card_items_json',
    'extra_json',
  ];
  const needsStructured = structuredInputKeys.some((key) => data[key] !== undefined);
  const needsTemplateResolve =
    data.module_template !== undefined
    || data.parent_id !== undefined
    || data.image_list_json !== undefined;

  const imageListForResolve = data.image_list_json !== undefined
    ? (Array.isArray(data.image_list_json) ? data.image_list_json : parseJsonSafe(data.image_list_json, []))
    : (current.image_list_json || []);
  const resolvedTemplate = resolveModuleTemplate({
    module_template: data.module_template !== undefined ? data.module_template : current.module_template,
    parent_id: mergedParentId,
    image_list_json: imageListForResolve,
  });

  const shouldNormalizeCarousel =
    needsStructured
    || data.module_template !== undefined
    || data.image_list_json !== undefined;
  const normalizedPayload = shouldNormalizeCarousel
    ? applyStandaloneCarouselRules({
      ...current,
      ...data,
      parent_id: mergedParentId,
      module_template: resolvedTemplate,
      image_list_json: imageListForResolve,
    })
    : { ...current, ...data, parent_id: mergedParentId, module_template: resolvedTemplate };

  let structured = null;
  if (needsStructured || (shouldNormalizeCarousel && mergedParentId === 0 && resolvedTemplate === 'multi_image_carousel')) {
    structured = toModuleForWrite(normalizedPayload);
    fields.push('main_title = ?');
    values.push(structured.main_title);
    fields.push('sub_title = ?');
    values.push(structured.sub_title);
    fields.push('body_text = ?');
    values.push(structured.body_text);
    fields.push('layout_mode = ?');
    values.push(structured.layout_mode);
    fields.push('image_list_json = ?');
    values.push(structured.image_list_json);
    fields.push('video_url = ?');
    values.push(structured.video_url);
    fields.push('link_url = ?');
    values.push(structured.link_url);
    fields.push('jump_type = ?');
    values.push(structured.jump_type);
    fields.push('jump_product_code = ?');
    values.push(structured.jump_product_code);
    fields.push('table_text = ?');
    values.push(structured.table_text);
    fields.push('qa_question = ?');
    values.push(structured.qa_question);
    fields.push('qa_answer = ?');
    values.push(structured.qa_answer);
    fields.push('card_items_json = ?');
    values.push(structured.card_items_json);
    fields.push('extra_json = ?');
    values.push(structured.extra_json);
    fields.push('module_data = ?');
    values.push(structured.module_data);
  }

  if (needsTemplateResolve || data.module_template !== undefined) {
    fields.push('module_template = ?');
    values.push(resolvedTemplate);
  }

  if (adminId) {
    fields.push('updated_admin_id = ?');
    values.push(adminId);
  }
  if (!fields.length) return getModuleById(id);
  values.push(id);
  await pool.query(`UPDATE nuoyuan_page_module SET ${fields.join(', ')} WHERE id = ?`, values);
  return getModuleById(id);
}

async function moveToRecycle(module, adminId) {
  const meta = await ensureRecycleColumnMeta();
  const columns = ['module_id', 'page_key', 'module_no', 'module_name', 'module_template'];
  const values = [module.id, module.page_key, module.module_no, module.module_name, module.module_template];
  if (meta.sort) {
    columns.push('sort');
    values.push(module.sort || 0);
  }
  if (meta.front_position) {
    columns.push('front_position');
    values.push(module.front_position || null);
  }
  columns.push('module_data', 'deleted_admin_id', 'deleted_at', 'expire_at');
  values.push(module.module_data || null, adminId || null);
  const placeholders = new Array(values.length).fill('?');
  placeholders.push('NOW()', 'DATE_ADD(NOW(), INTERVAL 30 DAY)');
  await pool.query(
    `INSERT INTO nuoyuan_module_recycle (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`,
    values
  );
}

async function deleteModule(id, adminId) {
  await ensureParentIdColumn();
  const module = await getModuleById(id);
  if (!module) return null;

  const [children] = await pool.query(
    'SELECT id FROM nuoyuan_page_module WHERE parent_id = ? ORDER BY sort ASC, module_no ASC',
    [id]
  );
  for (const child of children || []) {
    await deleteModule(child.id, adminId);
  }

  await moveToRecycle(module, adminId);
  await pool.query('DELETE FROM nuoyuan_page_module WHERE id = ?', [id]);
  return module;
}

async function getRecycleList({ pageKey, moduleNo, page = 1, pageSize = 20 }) {
  const offset = (page - 1) * pageSize;
  const conditions = [];
  const params = [];
  if (pageKey) {
    conditions.push('page_key = ?');
    params.push(pageKey);
  }
  if (moduleNo) {
    conditions.push('module_no = ?');
    params.push(moduleNo);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const [countRows] = await pool.query(`SELECT COUNT(*) AS total FROM nuoyuan_module_recycle ${where}`, params);
  const total = countRows[0].total;
  const meta = await ensureRecycleColumnMeta();
  const orderBy = meta.sort ? 'sort ASC, deleted_at DESC' : 'deleted_at DESC';
  const [rows] = await pool.query(
    `SELECT * FROM nuoyuan_module_recycle ${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
    [...params, parseInt(pageSize, 10), offset]
  );
  return paginate(rows, total, page, pageSize);
}

async function restoreFromRecycle(recycleId, adminId) {
  await ensureParentIdColumn();
  const [rows] = await pool.query('SELECT * FROM nuoyuan_module_recycle WHERE id = ?', [recycleId]);
  const recycle = rows[0];
  if (!recycle) return null;
  const nextNo = await getNextModuleNo(recycle.page_key);
  const legacy = parseJsonSafe(recycle.module_data, {});
  const imageList = parseJsonSafe(legacy.images, []);
  const cardItems = parseJsonSafe(legacy.cards, []);
  const extra = parseJsonSafe(legacy.extra, {});
  const meta = await ensureRecycleColumnMeta();
  const [result] = await pool.query(
    `INSERT INTO nuoyuan_page_module
    (page_key, parent_id, module_no, module_name, module_template, main_title, sub_title, body_text, layout_mode, image_list_json, video_url, link_url, jump_type, jump_product_code, table_text, qa_question, qa_answer, card_items_json, extra_json, front_position, module_data, sort, status, created_admin_id, updated_admin_id)
    VALUES (?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
    [
      recycle.page_key,
      nextNo,
      recycle.module_name,
      recycle.module_template,
      legacy.main_title || null,
      legacy.sub_title || null,
      legacy.body_text || null,
      legacy.layout_mode || null,
      JSON.stringify(imageList),
      legacy.video_url || null,
      legacy.link_url || null,
      legacy.jump_type || null,
      legacy.jump_product_code || null,
      legacy.table_text || null,
      legacy.qa_question || null,
      legacy.qa_answer || null,
      JSON.stringify(cardItems),
      JSON.stringify(extra),
      meta.front_position ? recycle.front_position : null,
      recycle.module_data,
      meta.sort ? (recycle.sort || 0) : 0,
      adminId || null,
      adminId || null,
    ]
  );
  await pool.query('DELETE FROM nuoyuan_module_recycle WHERE id = ?', [recycleId]);
  return getModuleById(result.insertId);
}

async function purgeRecycle(recycleId) {
  await pool.query('DELETE FROM nuoyuan_module_recycle WHERE id = ?', [recycleId]);
}

async function clearExpiredRecycle() {
  await pool.query('DELETE FROM nuoyuan_module_recycle WHERE expire_at < NOW()');
}

async function reorderModules(pageKey, orderIds = []) {
  for (let index = 0; index < orderIds.length; index += 1) {
    const id = orderIds[index];
    await pool.query('UPDATE nuoyuan_page_module SET sort = ? WHERE id = ? AND page_key = ?', [index, id, pageKey]);
  }
}

async function reorderRecycle(pageKey, orderIds = []) {
  const meta = await ensureRecycleColumnMeta();
  if (!meta.sort) return;
  for (let index = 0; index < orderIds.length; index += 1) {
    const id = orderIds[index];
    await pool.query('UPDATE nuoyuan_module_recycle SET sort = ? WHERE id = ? AND page_key = ?', [index, id, pageKey]);
  }
}

module.exports = {
  getTemplatesByPage,
  listModules,
  getModuleById,
  createModule,
  updateModule,
  deleteModule,
  getRecycleList,
  restoreFromRecycle,
  purgeRecycle,
  clearExpiredRecycle,
  reorderModules,
  reorderRecycle,
};
