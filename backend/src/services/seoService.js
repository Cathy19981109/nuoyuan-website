const pool = require('../config/db');
const { paginate } = require('../utils/response');

async function getConfigValue(key) {
  const [rows] = await pool.query('SELECT config_value FROM nuoyuan_config WHERE config_key = ?', [key]);
  return rows[0]?.config_value || '';
}

async function setConfigValue(key, value, name = key, description = '') {
  const [rows] = await pool.query('SELECT id FROM nuoyuan_config WHERE config_key = ?', [key]);
  if (rows.length) {
    await pool.query('UPDATE nuoyuan_config SET config_value = ? WHERE config_key = ?', [value || '', key]);
  } else {
    await pool.query(
      'INSERT INTO nuoyuan_config (config_key, config_value, name, description, sort) VALUES (?, ?, ?, ?, 0)',
      [key, value || '', name, description]
    );
  }
}

async function getGlobalSeo() {
  return {
    site_title: await getConfigValue('site_name'),
    seo_home_title: await getConfigValue('seo_home_title'),
    seo_global_keywords: await getConfigValue('seo_global_keywords'),
    seo_global_description: await getConfigValue('seo_global_description'),
    seo_share_img: await getConfigValue('seo_share_img'),
  };
}

async function saveGlobalSeo(payload = {}) {
  await setConfigValue('seo_home_title', payload.seo_home_title, '网站首页标题', '20-30字');
  await setConfigValue('seo_global_keywords', payload.seo_global_keywords, '全站SEO关键词', '8-15个词，逗号分隔');
  await setConfigValue('seo_global_description', payload.seo_global_description, '全站SEO描述', '120-180字');
  await setConfigValue('seo_share_img', payload.seo_share_img, '全站分享缩略图', '16:9，1200x675');
  return getGlobalSeo();
}

async function listPageSeo() {
  const [rows] = await pool.query(
    `SELECT id, title, nav_name, page_title, page_keywords, page_desc, page_seo_img
     FROM nuoyuan_page
     WHERE status = 1
     ORDER BY tab_sort ASC, id ASC`
  );
  return rows;
}

async function savePageSeo(pageId, payload = {}) {
  await pool.query(
    `UPDATE nuoyuan_page
     SET page_title = ?, page_keywords = ?, page_desc = ?, page_seo_img = ?
     WHERE id = ?`,
    [
      payload.page_title || null,
      payload.page_keywords || null,
      payload.page_desc || null,
      payload.page_seo_img || null,
      pageId,
    ]
  );
  const [rows] = await pool.query('SELECT id, title, nav_name, page_title, page_keywords, page_desc, page_seo_img FROM nuoyuan_page WHERE id = ?', [pageId]);
  return rows[0] || null;
}

async function listProductSeo({ keyword, page = 1, pageSize = 20 }) {
  const offset = (page - 1) * pageSize;
  const conditions = [];
  const params = [];
  if (keyword) {
    conditions.push('(name LIKE ? OR product_code LIKE ?)');
    params.push(`%${keyword}%`, `%${keyword}%`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const [countRows] = await pool.query(`SELECT COUNT(*) AS total FROM nuoyuan_product ${where}`, params);
  const total = countRows[0].total;
  const [rows] = await pool.query(
    `SELECT id, name, product_code, seo_title, seo_keywords, seo_desc, seo_img
     FROM nuoyuan_product ${where} ORDER BY id DESC LIMIT ? OFFSET ?`,
    [...params, parseInt(pageSize, 10), offset]
  );
  return paginate(rows, total, page, pageSize);
}

async function saveProductSeo(id, payload = {}) {
  await pool.query(
    'UPDATE nuoyuan_product SET seo_title = ?, seo_keywords = ?, seo_desc = ?, seo_img = ? WHERE id = ?',
    [payload.seo_title || null, payload.seo_keywords || null, payload.seo_desc || null, payload.seo_img || null, id]
  );
  const [rows] = await pool.query('SELECT id, name, product_code, seo_title, seo_keywords, seo_desc, seo_img FROM nuoyuan_product WHERE id = ?', [id]);
  return rows[0] || null;
}

async function listNewsSeo({ keyword, page = 1, pageSize = 20 }) {
  const offset = (page - 1) * pageSize;
  const conditions = [];
  const params = [];
  if (keyword) {
    conditions.push('(title LIKE ? OR id LIKE ?)');
    params.push(`%${keyword}%`, `%${keyword}%`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const [countRows] = await pool.query(`SELECT COUNT(*) AS total FROM nuoyuan_news ${where}`, params);
  const total = countRows[0].total;
  const [rows] = await pool.query(
    `SELECT id, title, seo_title, seo_keywords, seo_desc, seo_img
     FROM nuoyuan_news ${where} ORDER BY id DESC LIMIT ? OFFSET ?`,
    [...params, parseInt(pageSize, 10), offset]
  );
  return paginate(rows, total, page, pageSize);
}

async function saveNewsSeo(id, payload = {}) {
  await pool.query(
    'UPDATE nuoyuan_news SET seo_title = ?, seo_keywords = ?, seo_desc = ?, seo_img = ? WHERE id = ?',
    [payload.seo_title || null, payload.seo_keywords || null, payload.seo_desc || null, payload.seo_img || null, id]
  );
  const [rows] = await pool.query('SELECT id, title, seo_title, seo_keywords, seo_desc, seo_img FROM nuoyuan_news WHERE id = ?', [id]);
  return rows[0] || null;
}

async function getSeoMetaForPage({ pageKey, itemType, itemId }) {
  const global = await getGlobalSeo();
  if (itemType === 'product' && itemId) {
    const [rows] = await pool.query('SELECT name, seo_title, seo_keywords, seo_desc, seo_img FROM nuoyuan_product WHERE id = ?', [itemId]);
    const row = rows[0];
    if (row) {
      return {
        title: row.seo_title || row.name || global.seo_home_title || global.site_title,
        keywords: row.seo_keywords || global.seo_global_keywords,
        description: row.seo_desc || global.seo_global_description,
        image: row.seo_img || global.seo_share_img,
      };
    }
  }
  if (itemType === 'news' && itemId) {
    const [rows] = await pool.query('SELECT title, seo_title, seo_keywords, seo_desc, seo_img FROM nuoyuan_news WHERE id = ?', [itemId]);
    const row = rows[0];
    if (row) {
      return {
        title: row.seo_title || row.title || global.seo_home_title || global.site_title,
        keywords: row.seo_keywords || global.seo_global_keywords,
        description: row.seo_desc || global.seo_global_description,
        image: row.seo_img || global.seo_share_img,
      };
    }
  }
  if (pageKey) {
    const [rows] = await pool.query('SELECT title, nav_name, page_title, page_keywords, page_desc, page_seo_img FROM nuoyuan_page WHERE nav_name = ? LIMIT 1', [pageKey]);
    const row = rows[0];
    if (row) {
      return {
        title: row.page_title || row.title || global.seo_home_title || global.site_title,
        keywords: row.page_keywords || global.seo_global_keywords,
        description: row.page_desc || global.seo_global_description,
        image: row.page_seo_img || global.seo_share_img,
      };
    }
  }
  return {
    title: global.seo_home_title || global.site_title,
    keywords: global.seo_global_keywords,
    description: global.seo_global_description,
    image: global.seo_share_img,
  };
}

module.exports = {
  getGlobalSeo,
  saveGlobalSeo,
  listPageSeo,
  savePageSeo,
  listProductSeo,
  saveProductSeo,
  listNewsSeo,
  saveNewsSeo,
  getSeoMetaForPage,
};
