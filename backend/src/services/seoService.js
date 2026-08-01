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

async function listServiceSeo({ keyword, page = 1, pageSize = 20 }) {
  const offset = (page - 1) * pageSize;
  const conditions = [];
  const params = [];
  if (keyword) {
    conditions.push('(name LIKE ? OR service_code LIKE ? OR goods_code LIKE ? OR id LIKE ?)');
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const [countRows] = await pool.query(`SELECT COUNT(*) AS total FROM nuoyuan_service ${where}`, params);
  const total = countRows[0].total;
  const [rows] = await pool.query(
    `SELECT id, name, service_code, goods_code, seo_title, seo_keywords, seo_desc, seo_img
     FROM nuoyuan_service ${where} ORDER BY id DESC LIMIT ? OFFSET ?`,
    [...params, parseInt(pageSize, 10), offset]
  );
  return paginate(rows, total, page, pageSize);
}

async function saveServiceSeo(id, payload = {}) {
  await pool.query(
    'UPDATE nuoyuan_service SET seo_title = ?, seo_keywords = ?, seo_desc = ?, seo_img = ? WHERE id = ?',
    [payload.seo_title || null, payload.seo_keywords || null, payload.seo_desc || null, payload.seo_img || null, id]
  );
  const [rows] = await pool.query(
    'SELECT id, name, service_code, goods_code, seo_title, seo_keywords, seo_desc, seo_img FROM nuoyuan_service WHERE id = ?',
    [id]
  );
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
    const [rows] = await pool.query(
      'SELECT name, short_desc, cover_image, seo_title, seo_keywords, seo_desc, seo_img, product_type, app_type, level_tag FROM nuoyuan_product WHERE id = ?',
      [itemId]
    );
    const row = rows[0];
    if (row) {
      return {
        title: row.seo_title || clipText(row.name, 30) || global.seo_home_title || global.site_title,
        keywords: row.seo_keywords || joinKeywords([row.name, row.product_type, row.app_type, row.level_tag, '诺元智合']) || global.seo_global_keywords,
        description: row.seo_desc || clipText(row.short_desc, 180) || global.seo_global_description,
        image: row.seo_img || row.cover_image || global.seo_share_img,
      };
    }
  }
  if (itemType === 'service' && itemId) {
    const [rows] = await pool.query(
      'SELECT name, short_desc, cover_image, seo_title, seo_keywords, seo_desc, seo_img, product_type, app_type, level_tag FROM nuoyuan_service WHERE id = ?',
      [itemId]
    );
    const row = rows[0];
    if (row) {
      return {
        title: row.seo_title || clipText(row.name, 30) || global.seo_home_title || global.site_title,
        keywords: row.seo_keywords || joinKeywords([row.name, row.product_type, row.app_type, row.level_tag, '诺元智合']) || global.seo_global_keywords,
        description: row.seo_desc || clipText(row.short_desc, 180) || global.seo_global_description,
        image: row.seo_img || row.cover_image || global.seo_share_img,
      };
    }
  }
  if (itemType === 'news' && itemId) {
    const [rows] = await pool.query(
      'SELECT title, short_desc, cover_image, seo_title, seo_keywords, seo_desc, seo_img FROM nuoyuan_news WHERE id = ?',
      [itemId]
    );
    const row = rows[0];
    if (row) {
      return {
        title: row.seo_title || row.title || global.seo_home_title || global.site_title,
        keywords: row.seo_keywords || joinKeywords([row.title, '诺元智合', '新闻动态']) || global.seo_global_keywords,
        description: row.seo_desc || clipText(row.short_desc, 180) || global.seo_global_description,
        image: row.seo_img || row.cover_image || global.seo_share_img,
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

function clipText(str, max) {
  const s = String(str || '').replace(/\s+/g, ' ').trim();
  if (!s) return '';
  if (s.length <= max) return s;
  return `${s.slice(0, Math.max(0, max - 1))}…`;
}

function isBlank(v) {
  return !String(v || '').trim();
}

function joinKeywords(parts = [], limit = 12) {
  const seen = new Set();
  const out = [];
  parts.flatMap((p) => String(p || '').split(/[,，、|；;]+/))
    .map((x) => x.trim())
    .filter(Boolean)
    .forEach((word) => {
      const key = word.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      out.push(word);
    });
  return out.slice(0, limit).join('，');
}

function firstImageFromListJson(raw) {
  let list = raw;
  if (typeof raw === 'string') {
    try { list = JSON.parse(raw); } catch { list = []; }
  }
  if (!Array.isArray(list) || !list.length) return '';
  const first = list[0];
  if (typeof first === 'string') return first;
  return String(first?.url || '').trim();
}

function pickField(existing, generated, overwrite) {
  const next = String(generated || '').trim();
  if (!next) return existing || '';
  if (overwrite || isBlank(existing)) return next;
  return existing;
}

const PAGE_KEYWORD_FALLBACK = {
  home: ['诺元智合', '基因编辑', 'CRISPR', '科研试剂', '生物科技'],
  products: ['产品中心', '科研试剂', '分子生物学', '细胞培养', '诺元智合'],
  services: ['技术服务', '基因编辑服务', 'RNA合成', 'CRISPR/Cas9', '诺元智合'],
  applications: ['应用领域', '基因编辑应用', '生命科学', '诺元智合'],
  news: ['新闻动态', '行业资讯', '公司动态', '诺元智合'],
  about: ['关于我们', '诺元智合', '生物科技公司', '基因编辑'],
  contact: ['联系我们', '诺元智合', '重庆', '询价'],
};

async function loadBannerByPageKey(pageKey) {
  const [rows] = await pool.query(
    `SELECT main_title, body_text, image_list_json, extra_json
     FROM nuoyuan_page_module
     WHERE page_key = ? AND status = 1
     ORDER BY sort ASC, id ASC`,
    [pageKey]
  );
  const banner = (rows || []).find((row) => {
    let extra = row.extra_json;
    if (typeof extra === 'string') {
      try { extra = JSON.parse(extra); } catch { extra = {}; }
    }
    const key = String(extra?.system_key || '');
    return key.endsWith('_banner') || String(row.module_name || '') === 'Banner模块';
  }) || rows?.[0] || null;
  if (!banner) return { title: '', body: '', image: '' };
  const body = String(banner.body_text || '').trim();
  // skip system list placeholder copy
  const safeBody = /系统固定展示区|不可编辑/.test(body) ? '' : body;
  return {
    title: String(banner.main_title || '').trim(),
    body: safeBody,
    image: firstImageFromListJson(banner.image_list_json),
  };
}

/**
 * Auto-capture SEO from site content / banners / product&service listings.
 * mode: fill_empty (default) keeps manual edits; overwrite replaces all.
 */
async function autoSyncSeo({ mode = 'fill_empty' } = {}) {
  const overwrite = mode === 'overwrite';
  const summary = { global: 0, pages: 0, products: 0, services: 0, news: 0 };

  const brandTitle = (await getConfigValue('brand_title')) || '诺元智合';
  const siteName = await getConfigValue('site_name');
  const slogan = await getConfigValue('site_slogan');
  const footerDesc = await getConfigValue('footer_brand_desc');
  const brandLogo = await getConfigValue('brand_logo') || await getConfigValue('site_logo');
  const homeBanner = await loadBannerByPageKey('home');

  const [productNames] = await pool.query('SELECT name FROM nuoyuan_product WHERE status = 1 ORDER BY sort ASC, id ASC LIMIT 8');
  const [serviceNames] = await pool.query('SELECT name FROM nuoyuan_service WHERE status = 1 ORDER BY sort ASC, id ASC LIMIT 8');

  const globalCurrent = await getGlobalSeo();
  const globalNext = {
    seo_home_title: pickField(
      globalCurrent.seo_home_title,
      clipText([brandTitle, slogan].filter(Boolean).join('｜') || siteName || brandTitle, 30),
      overwrite
    ),
    seo_global_keywords: pickField(
      globalCurrent.seo_global_keywords,
      joinKeywords([
        brandTitle,
        '基因编辑',
        'CRISPR/Cas9',
        '科研实验试剂',
        '生物科技',
        ...(productNames || []).map((r) => r.name),
        ...(serviceNames || []).map((r) => r.name),
      ]),
      overwrite
    ),
    seo_global_description: pickField(
      globalCurrent.seo_global_description,
      clipText(footerDesc || homeBanner.body || `${brandTitle}专注基因编辑核心服务与科研实验试剂，为生命科学研究提供高品质解决方案。`, 180),
      overwrite
    ),
    seo_share_img: pickField(
      globalCurrent.seo_share_img,
      homeBanner.image || brandLogo,
      overwrite
    ),
  };
  await saveGlobalSeo(globalNext);
  summary.global = 1;

  const pages = await listPageSeo();
  for (const page of pages) {
    const banner = await loadBannerByPageKey(page.nav_name);
    const payload = {
      page_title: pickField(page.page_title, clipText(banner.title || page.title, 30), overwrite),
      page_keywords: pickField(
        page.page_keywords,
        joinKeywords([page.title, banner.title, ...(PAGE_KEYWORD_FALLBACK[page.nav_name] || [brandTitle])]),
        overwrite
      ),
      page_desc: pickField(
        page.page_desc,
        clipText(banner.body || footerDesc || `${page.title}｜${brandTitle}`, 180),
        overwrite
      ),
      page_seo_img: pickField(page.page_seo_img, banner.image || homeBanner.image || brandLogo, overwrite),
    };
    await savePageSeo(page.id, payload);
    summary.pages += 1;
  }

  const [products] = await pool.query(
    `SELECT id, name, short_desc, cover_image, product_type, app_type, level_tag,
            seo_title, seo_keywords, seo_desc, seo_img
     FROM nuoyuan_product`
  );
  for (const row of products || []) {
    const payload = {
      seo_title: pickField(row.seo_title, clipText(row.name, 30), overwrite),
      seo_keywords: pickField(
        row.seo_keywords,
        joinKeywords([row.name, row.product_type, row.app_type, row.level_tag, brandTitle, '科研试剂']),
        overwrite
      ),
      seo_desc: pickField(row.seo_desc, clipText(row.short_desc || `${row.name}｜${brandTitle}`, 180), overwrite),
      seo_img: pickField(row.seo_img, row.cover_image, overwrite),
    };
    await saveProductSeo(row.id, payload);
    summary.products += 1;
  }

  const [services] = await pool.query(
    `SELECT id, name, short_desc, cover_image, product_type, app_type, level_tag,
            seo_title, seo_keywords, seo_desc, seo_img
     FROM nuoyuan_service`
  );
  for (const row of services || []) {
    const payload = {
      seo_title: pickField(row.seo_title, clipText(row.name, 30), overwrite),
      seo_keywords: pickField(
        row.seo_keywords,
        joinKeywords([row.name, row.product_type, row.app_type, row.level_tag, brandTitle, '技术服务']),
        overwrite
      ),
      seo_desc: pickField(row.seo_desc, clipText(row.short_desc || `${row.name}｜${brandTitle}`, 180), overwrite),
      seo_img: pickField(row.seo_img, row.cover_image, overwrite),
    };
    await saveServiceSeo(row.id, payload);
    summary.services += 1;
  }

  const [newsRows] = await pool.query(
    `SELECT id, title, short_desc, cover_image, seo_title, seo_keywords, seo_desc, seo_img
     FROM nuoyuan_news`
  );
  for (const row of newsRows || []) {
    const payload = {
      seo_title: pickField(row.seo_title, clipText(row.title, 30), overwrite),
      seo_keywords: pickField(row.seo_keywords, joinKeywords([row.title, brandTitle, '新闻动态']), overwrite),
      seo_desc: pickField(row.seo_desc, clipText(row.short_desc || row.title, 180), overwrite),
      seo_img: pickField(row.seo_img, row.cover_image, overwrite),
    };
    await saveNewsSeo(row.id, payload);
    summary.news += 1;
  }

  return { mode: overwrite ? 'overwrite' : 'fill_empty', summary, global: await getGlobalSeo() };
}

module.exports = {
  getGlobalSeo,
  saveGlobalSeo,
  listPageSeo,
  savePageSeo,
  listProductSeo,
  saveProductSeo,
  listServiceSeo,
  saveServiceSeo,
  listNewsSeo,
  saveNewsSeo,
  getSeoMetaForPage,
  autoSyncSeo,
};
