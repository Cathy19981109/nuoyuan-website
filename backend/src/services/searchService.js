const pool = require('../config/db');

const PAGE_PATH_MAP = {
  home: '/',
  products: '/products',
  services: '/services',
  news: '/news',
  about: '/about',
  contact: '/contact',
  applications: '/applications',
};

const PAGE_LABEL_MAP = {
  home: '首页',
  products: '产品中心',
  services: '技术服务',
  news: '新闻动态',
  about: '关于我们',
  contact: '联系我们',
  applications: '应用领域',
};

function truncate(text, max = 80) {
  const s = String(text || '').replace(/\s+/g, ' ').trim();
  if (!s) return '';
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

async function search(keyword, { page = 1, pageSize = 8 } = {}) {
  if (!keyword || !keyword.trim()) {
    return {
      products: [],
      services: [],
      news: [],
      applications: [],
      modules: [],
      pages: [],
      suggestions: [],
    };
  }

  const raw = keyword.trim();
  const kw = `%${raw}%`;
  const limit = Math.min(Math.max(parseInt(pageSize, 10) || 8, 1), 20);

  const [products] = await pool.query(
    `SELECT id, name, short_desc, cover_image, product_code, goods_code, 'product' AS type
     FROM nuoyuan_product
     WHERE status = 1
       AND (
         name LIKE ? OR en_name LIKE ? OR short_desc LIKE ?
         OR product_code LIKE ? OR goods_code LIKE ?
       )
     ORDER BY sort ASC, id DESC
     LIMIT ?`,
    [kw, kw, kw, kw, kw, limit]
  );

  const [services] = await pool.query(
    `SELECT id, name, short_desc, cover_image, service_code, goods_code, 'service' AS type
     FROM nuoyuan_service
     WHERE status = 1
       AND (
         name LIKE ? OR en_name LIKE ? OR short_desc LIKE ?
         OR service_code LIKE ? OR goods_code LIKE ?
       )
     ORDER BY sort ASC, id DESC
     LIMIT ?`,
    [kw, kw, kw, kw, kw, limit]
  );

  const [news] = await pool.query(
    `SELECT id, title, short_desc, cover_image, 'news' AS type
     FROM nuoyuan_news
     WHERE status = 1 AND (title LIKE ? OR short_desc LIKE ? OR content LIKE ?)
     ORDER BY publish_time DESC, id DESC
     LIMIT ?`,
    [kw, kw, kw, limit]
  );

  const [applications] = await pool.query(
    `SELECT id, name, description AS short_desc, cover_image, 'application' AS type
     FROM nuoyuan_application
     WHERE status = 1 AND (name LIKE ? OR description LIKE ?)
     ORDER BY sort ASC, id DESC
     LIMIT ?`,
    [kw, kw, limit]
  );

  const [modules] = await pool.query(
    `SELECT id, page_key, module_name, main_title, sub_title, body_text, 'module' AS type
     FROM nuoyuan_page_module
     WHERE status = 1
       AND (
         main_title LIKE ? OR module_name LIKE ? OR sub_title LIKE ? OR body_text LIKE ?
       )
       AND IFNULL(JSON_UNQUOTE(JSON_EXTRACT(extra_json, '$.system_key')), '') NOT LIKE '%_list_block'
     ORDER BY
       CASE
         WHEN main_title LIKE ? THEN 0
         WHEN module_name LIKE ? THEN 1
         ELSE 2
       END,
       sort ASC, id DESC
     LIMIT ?`,
    [kw, kw, kw, kw, kw, kw, limit]
  );

  const [pages] = await pool.query(
    `SELECT id, title, nav_name, cover_image, 'page' AS type
     FROM nuoyuan_page
     WHERE status = 1 AND (title LIKE ? OR nav_name LIKE ?)
     ORDER BY id ASC
     LIMIT ?`,
    [kw, kw, limit]
  );

  const mappedModules = modules.map((row) => {
    const pageKey = String(row.page_key || '');
    const path = PAGE_PATH_MAP[pageKey] || '/';
    const pageLabel = PAGE_LABEL_MAP[pageKey] || pageKey;
    const title = String(row.main_title || row.module_name || '内容板块').trim();
    return {
      ...row,
      title,
      short_desc: truncate(row.body_text || row.sub_title || `${pageLabel}内容板块`),
      page_label: pageLabel,
      path,
      hash: `module-${row.id}`,
      to: `${path}#module-${row.id}`,
    };
  });

  const mappedPages = pages.map((row) => {
    const pageKey = String(row.nav_name || '');
    return {
      ...row,
      short_desc: PAGE_LABEL_MAP[pageKey] || row.nav_name || '',
      path: PAGE_PATH_MAP[pageKey] || row.link_url || '/',
      to: PAGE_PATH_MAP[pageKey] || '/',
    };
  });

  const suggestions = [
    ...products.map((item) => ({
      type: 'product',
      typeLabel: '产品',
      id: item.id,
      title: item.name,
      desc: truncate(item.short_desc || item.product_code || item.goods_code),
      to: `/products/${item.id}`,
    })),
    ...services.map((item) => ({
      type: 'service',
      typeLabel: '服务',
      id: item.id,
      title: item.name,
      desc: truncate(item.short_desc || item.service_code || item.goods_code),
      to: `/services/${item.id}`,
    })),
    ...mappedModules.map((item) => ({
      type: 'module',
      typeLabel: '内容板块',
      id: item.id,
      title: item.title,
      desc: truncate(`${item.page_label} · ${item.short_desc}`),
      to: item.to,
    })),
    ...news.map((item) => ({
      type: 'news',
      typeLabel: '新闻',
      id: item.id,
      title: item.title,
      desc: truncate(item.short_desc),
      to: `/news/${item.id}`,
    })),
    ...applications.map((item) => ({
      type: 'application',
      typeLabel: '应用',
      id: item.id,
      title: item.name,
      desc: truncate(item.short_desc),
      to: `/applications`,
    })),
    ...mappedPages.map((item) => ({
      type: 'page',
      typeLabel: '页面',
      id: item.id,
      title: item.title,
      desc: truncate(item.short_desc),
      to: item.to,
    })),
  ].slice(0, 12);

  return {
    products,
    services,
    news,
    applications,
    modules: mappedModules,
    pages: mappedPages,
    suggestions,
  };
}

module.exports = { search };
