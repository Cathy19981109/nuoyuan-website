const pool = require('../config/db');

const GROUP_TABLE = 'nuoyuan_product_filter_group';
const TAG_TABLE = 'nuoyuan_product_filter_tag';
const ITEM_TABLE = 'nuoyuan_product';
const ITEM_JSON_COL = 'filter_tags_json';
const LEGACY_KEYS = ['product_type', 'app_type', 'level_tag'];

let defaultEnsured = false;

async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${GROUP_TABLE} (
      id INT NOT NULL AUTO_INCREMENT,
      group_key VARCHAR(64) NOT NULL,
      group_title VARCHAR(80) NOT NULL,
      sort INT NOT NULL DEFAULT 0,
      status TINYINT(1) NOT NULL DEFAULT 1,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uniq_group_key (group_key)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='产品筛选分组';
  `);
  const [tagCols] = await pool.query(`SHOW COLUMNS FROM ${TAG_TABLE}`);
  const tagSet = new Set(tagCols.map((r) => r.Field));
  if (!tagSet.has('group_id')) {
    await pool.query(`ALTER TABLE ${TAG_TABLE} ADD COLUMN group_id INT DEFAULT NULL AFTER id`);
  }
  const [itemCols] = await pool.query(`SHOW COLUMNS FROM ${ITEM_TABLE}`);
  const itemSet = new Set(itemCols.map((r) => r.Field));
  if (!itemSet.has('product_type')) {
    await pool.query(`ALTER TABLE ${ITEM_TABLE} ADD COLUMN product_type TEXT DEFAULT NULL AFTER video_url`);
  }
  if (!itemSet.has('app_type')) {
    await pool.query(`ALTER TABLE ${ITEM_TABLE} ADD COLUMN app_type TEXT DEFAULT NULL AFTER product_type`);
  }
  if (!itemSet.has('level_tag')) {
    await pool.query(`ALTER TABLE ${ITEM_TABLE} ADD COLUMN level_tag TEXT DEFAULT NULL AFTER app_type`);
  }
  if (!itemSet.has('filter_tags_json')) {
    await pool.query(`ALTER TABLE ${ITEM_TABLE} ADD COLUMN filter_tags_json TEXT DEFAULT NULL AFTER level_tag`);
  }
}

function normalizeMultiSelect(input) {
  if (Array.isArray(input)) return input.map((v) => String(v || '').trim()).filter(Boolean);
  if (typeof input === 'string') return input.split(',').map((v) => v.trim()).filter(Boolean);
  return [];
}

function normalizeAndDedupe(items) {
  return Array.from(new Set((items || []).map((v) => String(v || '').trim()).filter(Boolean)));
}

function splitStoredTags(raw) {
  if (!raw) return [];
  return String(raw).split(',').map((v) => v.trim()).filter(Boolean);
}

function safeParseJson(raw, fallback = {}) {
  if (!raw) return fallback;
  try {
    const val = JSON.parse(raw);
    return val && typeof val === 'object' ? val : fallback;
  } catch {
    return fallback;
  }
}

function normalizeFilterMap(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
  const out = {};
  Object.keys(input).forEach((k) => {
    const key = String(k || '').trim();
    if (!key) return;
    out[key] = normalizeAndDedupe(normalizeMultiSelect(input[key]));
  });
  return out;
}

function slugifyKey(text) {
  const seed = String(text || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return seed || `group_${Date.now().toString(36)}`;
}

async function buildUniqueGroupKey(rawText) {
  const base = slugifyKey(rawText);
  let key = base;
  let idx = 1;
  while (true) {
    const [rows] = await pool.query(`SELECT id FROM ${GROUP_TABLE} WHERE group_key = ? LIMIT 1`, [key]);
    if (!rows.length) return key;
    idx += 1;
    key = `${base}_${idx}`;
  }
}

async function getGroups(includeDisabled = false) {
  await ensureSchema();
  const where = includeDisabled ? '' : 'WHERE status = 1';
  const [rows] = await pool.query(
    `SELECT id, group_key, group_title, sort, status FROM ${GROUP_TABLE} ${where} ORDER BY sort ASC, id ASC`
  );
  return rows;
}

async function getTags(includeDisabled = false) {
  await ensureSchema();
  const where = includeDisabled ? '' : 'WHERE status = 1';
  const [rows] = await pool.query(
    `SELECT id, tag_group, tag_name, sort, status FROM ${TAG_TABLE} ${where} ORDER BY tag_group ASC, sort ASC, id ASC`
  );
  return rows;
}

async function getGroupTree(includeDisabled = false) {
  const groups = await getGroups(includeDisabled);
  const tags = await getTags(includeDisabled);
  const tagMap = new Map();
  groups.forEach((g) => tagMap.set(g.group_key, []));
  tags.forEach((t) => {
    if (!tagMap.has(t.tag_group)) return;
    tagMap.get(t.tag_group).push({
      id: t.id,
      name: t.tag_name,
      sort: t.sort,
      status: t.status,
    });
  });
  return groups.map((g) => ({
    id: g.id,
    key: g.group_key,
    title: g.group_title,
    sort: g.sort,
    status: g.status,
    tags: tagMap.get(g.group_key) || [],
  }));
}

function treeToLegacyObject(tree = []) {
  const out = {};
  tree.forEach((g) => {
    out[g.key] = (g.tags || []).map((t) => ({ id: t.id, name: t.name, sort: t.sort, status: t.status }));
  });
  return out;
}

async function ensureDefaultSelectionsOnce() {
  if (defaultEnsured) return;
  defaultEnsured = true;
  await ensureSchema();
  const tree = await getGroupTree(false);
  if (!tree.length) return;
  if (!tree.length) {
    const defaults = [
      { key: 'product_type', title: '产品类型标签' },
      { key: 'app_type', title: '应用分类标签' },
      { key: 'level_tag', title: '级别标签' },
    ];
    for (let i = 0; i < defaults.length; i += 1) {
      await pool.query(
        `INSERT IGNORE INTO ${GROUP_TABLE} (group_key, group_title, sort, status) VALUES (?, ?, ?, 1)`,
        [defaults[i].key, defaults[i].title, i]
      );
    }
  }
  const treeReady = await getGroupTree(false);
  if (!treeReady.length) return;
  const groupTagSet = {};
  treeReady.forEach((g) => {
    groupTagSet[g.key] = (g.tags || []).map((t) => t.name);
  });
  const [items] = await pool.query(
    `SELECT id, ${ITEM_JSON_COL}, product_type, app_type, level_tag FROM ${ITEM_TABLE}`
  );
  for (const row of items) {
    const rawMap = safeParseJson(row[ITEM_JSON_COL], {});
    const current = normalizeFilterMap(rawMap);
    LEGACY_KEYS.forEach((k) => {
      if (!current[k] || !current[k].length) current[k] = splitStoredTags(row[k]);
    });
    let changed = Object.keys(rawMap).some((k) => typeof rawMap[k] === 'string');
    treeReady.forEach((g) => {
      const validSet = new Set(groupTagSet[g.key] || []);
      const picked = (current[g.key] || []).filter((name) => validSet.has(name));
      if (!picked.length && validSet.size) {
        current[g.key] = [Array.from(validSet)[0]];
        changed = true;
      } else if (picked.length !== (current[g.key] || []).length) {
        current[g.key] = picked;
        changed = true;
      } else {
        current[g.key] = picked;
      }
    });
    const nextJson = JSON.stringify(current);
    if (!changed && String(row[ITEM_JSON_COL] || '') === nextJson) continue;
    await pool.query(
      `UPDATE ${ITEM_TABLE} SET ${ITEM_JSON_COL} = ?, product_type = ?, app_type = ?, level_tag = ? WHERE id = ?`,
      [
        nextJson,
        (current.product_type || []).join(','),
        (current.app_type || []).join(','),
        (current.level_tag || []).join(','),
        row.id,
      ]
    );
  }
}

async function getTagOptions() {
  await ensureSchema();
  await ensureDefaultSelectionsOnce();
  const tree = await getGroupTree(false);
  return {
    groups: tree,
    ...treeToLegacyObject(tree),
  };
}

async function getTagOptionsAdmin() {
  await ensureSchema();
  await ensureDefaultSelectionsOnce();
  const tree = await getGroupTree(true);
  return {
    groups: tree,
    ...treeToLegacyObject(tree),
  };
}

async function createGroup(data) {
  await ensureSchema();
  await ensureDefaultSelectionsOnce();
  const title = String(data.group_title || data.title || '').trim();
  if (!title) {
    const err = new Error('分组名称不能为空');
    err.name = 'ValidationError';
    throw err;
  }
  const key = await buildUniqueGroupKey(title);
  const [maxRows] = await pool.query(`SELECT IFNULL(MAX(sort), -1) + 1 AS nextSort FROM ${GROUP_TABLE}`);
  const [result] = await pool.query(
    `INSERT INTO ${GROUP_TABLE} (group_key, group_title, sort, status) VALUES (?, ?, ?, 1)`,
    [key, title, maxRows[0].nextSort || 0]
  );
  const [rows] = await pool.query(`SELECT id, group_key, group_title, sort, status FROM ${GROUP_TABLE} WHERE id = ?`, [result.insertId]);
  return rows[0] || null;
}

async function updateGroup(id, data) {
  await ensureSchema();
  const title = String(data.group_title || data.title || '').trim();
  if (!title) {
    const err = new Error('分组名称不能为空');
    err.name = 'ValidationError';
    throw err;
  }
  await pool.query(`UPDATE ${GROUP_TABLE} SET group_title = ? WHERE id = ?`, [title, id]);
  const [rows] = await pool.query(`SELECT id, group_key, group_title, sort, status FROM ${GROUP_TABLE} WHERE id = ?`, [id]);
  return rows[0] || null;
}

async function deleteGroup(id) {
  await ensureSchema();
  const [rows] = await pool.query(`SELECT group_key FROM ${GROUP_TABLE} WHERE id = ?`, [id]);
  const row = rows[0];
  if (!row) return;
  await pool.query(`DELETE FROM ${TAG_TABLE} WHERE tag_group = ?`, [row.group_key]);
  await pool.query(`DELETE FROM ${GROUP_TABLE} WHERE id = ?`, [id]);
}

async function reorderGroups(orderIds = []) {
  await ensureSchema();
  for (let i = 0; i < orderIds.length; i += 1) {
    await pool.query(`UPDATE ${GROUP_TABLE} SET sort = ? WHERE id = ?`, [i, orderIds[i]]);
  }
}

async function createTag(data) {
  await ensureSchema();
  await ensureDefaultSelectionsOnce();
  const groupKey = String(data.tag_group || data.group_key || '').trim();
  const tagName = String(data.tag_name || '').trim();
  if (!groupKey) {
    const err = new Error('请选择筛选分组');
    err.name = 'ValidationError';
    throw err;
  }
  if (!tagName) {
    const err = new Error('标签名称不能为空');
    err.name = 'ValidationError';
    throw err;
  }
  const [groupRows] = await pool.query(`SELECT id FROM ${GROUP_TABLE} WHERE group_key = ? LIMIT 1`, [groupKey]);
  if (!groupRows.length) {
    const err = new Error('筛选分组不存在');
    err.name = 'ValidationError';
    throw err;
  }
  const [exists] = await pool.query(
    `SELECT id FROM ${TAG_TABLE} WHERE tag_group = ? AND tag_name = ? LIMIT 1`,
    [groupKey, tagName]
  );
  if (exists.length) {
    const err = new Error('同分组下标签已存在');
    err.name = 'ValidationError';
    throw err;
  }
  const [maxRows] = await pool.query(
    `SELECT IFNULL(MAX(sort), -1) + 1 AS nextSort FROM ${TAG_TABLE} WHERE tag_group = ?`,
    [groupKey]
  );
  const [result] = await pool.query(
    `INSERT INTO ${TAG_TABLE} (tag_group, tag_name, sort, status) VALUES (?, ?, ?, 1)`,
    [groupKey, tagName, maxRows[0].nextSort || 0]
  );
  const [rows] = await pool.query(`SELECT * FROM ${TAG_TABLE} WHERE id = ?`, [result.insertId]);
  return rows[0] || null;
}

async function updateTag(id, data) {
  const fields = [];
  const values = [];
  if (data.tag_name !== undefined) {
    const tagName = String(data.tag_name || '').trim();
    if (!tagName) {
      const err = new Error('标签名称不能为空');
      err.name = 'ValidationError';
      throw err;
    }
    fields.push('tag_name = ?');
    values.push(tagName);
  }
  if (data.status !== undefined) {
    fields.push('status = ?');
    values.push(Number(data.status) ? 1 : 0);
  }
  if (!fields.length) {
    const [rows] = await pool.query(`SELECT * FROM ${TAG_TABLE} WHERE id = ?`, [id]);
    return rows[0] || null;
  }
  values.push(id);
  await pool.query(`UPDATE ${TAG_TABLE} SET ${fields.join(', ')} WHERE id = ?`, values);
  const [rows] = await pool.query(`SELECT * FROM ${TAG_TABLE} WHERE id = ?`, [id]);
  return rows[0] || null;
}

async function deleteTag(id) {
  await pool.query(`DELETE FROM ${TAG_TABLE} WHERE id = ?`, [id]);
}

async function reorderTags(tagGroup, orderIds = []) {
  const key = String(tagGroup || '').trim();
  if (!key) return;
  for (let i = 0; i < orderIds.length; i += 1) {
    await pool.query(`UPDATE ${TAG_TABLE} SET sort = ? WHERE id = ? AND tag_group = ?`, [i, orderIds[i], key]);
  }
}

/** Match tag in array JSON / scalar JSON / legacy comma column. */
function pushTagMatchCondition(orRows, params, groupKey, name) {
  orRows.push("JSON_SEARCH(CAST(IFNULL(NULLIF(filter_tags_json, ''), '{}') AS JSON), 'one', ?, NULL, ?) IS NOT NULL");
  params.push(name, `$."${groupKey}"[*]`);
  orRows.push("JSON_UNQUOTE(JSON_EXTRACT(CAST(IFNULL(NULLIF(filter_tags_json, ''), '{}') AS JSON), ?)) = ?");
  params.push(`$."${groupKey}"`, name);
  if (LEGACY_KEYS.includes(groupKey)) {
    orRows.push(`FIND_IN_SET(?, REPLACE(REPLACE(IFNULL(${groupKey}, ''), '，', ','), ' ', '')) > 0`);
    params.push(name);
  }
}

function addTagFilterConditions(conditions, params, tagFilterMap = {}) {
  const map = normalizeFilterMap(tagFilterMap);
  Object.keys(map).forEach((groupKey) => {
    const names = map[groupKey];
    if (!names.length) return;
    const orRows = [];
    names.forEach((name) => {
      pushTagMatchCondition(orRows, params, groupKey, name);
    });
    if (orRows.length) conditions.push(`(${orRows.join(' OR ')})`);
  });
}

async function getFilterStat({ keyword = '', tagFilters = {} }) {
  await ensureDefaultSelectionsOnce();
  const tree = await getGroupTree(false);
  const baseConds = ['status = 1'];
  const baseParams = [];
  if (keyword) {
    const fuzzy = `%${keyword}%`;
    baseConds.push('(name LIKE ? OR en_name LIKE ? OR goods_code LIKE ? OR short_desc LIKE ?)');
    baseParams.push(fuzzy, fuzzy, fuzzy, fuzzy);
  }
  const selectedMap = normalizeFilterMap(tagFilters);
  const output = { groups: [] };
  for (const group of tree) {
    const groupBlock = { key: group.key, title: group.title, tags: [] };
    for (const tag of group.tags || []) {
      const conds = [...baseConds];
      const params = [...baseParams];
      const otherMap = { ...selectedMap };
      delete otherMap[group.key];
      addTagFilterConditions(conds, params, otherMap);
      const matchRows = [];
      pushTagMatchCondition(matchRows, params, group.key, tag.name);
      conds.push(`(${matchRows.join(' OR ')})`);
      const [rows] = await pool.query(
        `SELECT COUNT(*) AS total FROM ${ITEM_TABLE} WHERE ${conds.join(' AND ')}`,
        params
      );
      groupBlock.tags.push({
        name: tag.name,
        total: rows[0]?.total || 0,
        checked: (selectedMap[group.key] || []).includes(tag.name),
      });
    }
    output.groups.push(groupBlock);
    output[group.key] = groupBlock.tags;
  }
  return output;
}

async function validateRequiredSelections(selectionMap = {}) {
  await ensureSchema();
  await ensureDefaultSelectionsOnce();
  const normalized = normalizeFilterMap(selectionMap);
  const tree = await getGroupTree(false);
  for (const g of tree) {
    const picked = normalized[g.key] || [];
    if (!picked.length) {
      const err = new Error(`请至少选择1项「${g.title}」`);
      err.name = 'ValidationError';
      throw err;
    }
  }
}

function parseSelectionMapFromRow(row) {
  const jsonMap = normalizeFilterMap(safeParseJson(row?.filter_tags_json, {}));
  LEGACY_KEYS.forEach((k) => {
    if (!jsonMap[k] || !jsonMap[k].length) jsonMap[k] = splitStoredTags(row?.[k]);
  });
  return jsonMap;
}

module.exports = {
  normalizeMultiSelect,
  normalizeAndDedupe,
  splitStoredTags,
  normalizeFilterMap,
  addTagFilterConditions,
  getTagOptions,
  getTagOptionsAdmin,
  createGroup,
  updateGroup,
  deleteGroup,
  reorderGroups,
  createTag,
  updateTag,
  deleteTag,
  reorderTags,
  getFilterStat,
  validateRequiredSelections,
  parseSelectionMapFromRow,
};
