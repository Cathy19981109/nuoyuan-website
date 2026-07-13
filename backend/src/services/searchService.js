const pool = require('../config/db');

async function search(keyword, { page = 1, pageSize = 10 } = {}) {
  if (!keyword || !keyword.trim()) {
    return { products: [], news: [], pages: [] };
  }

  const kw = `%${keyword.trim()}%`;
  const limit = parseInt(pageSize, 10);

  const [products] = await pool.query(
    `SELECT id, name, short_desc, cover_image, 'product' AS type FROM nuoyuan_product
     WHERE status = 1 AND (name LIKE ? OR short_desc LIKE ?) ORDER BY sort ASC LIMIT ?`,
    [kw, kw, limit]
  );

  const [news] = await pool.query(
    `SELECT id, title, short_desc, cover_image, 'news' AS type FROM nuoyuan_news
     WHERE status = 1 AND (title LIKE ? OR short_desc LIKE ?) ORDER BY publish_time DESC LIMIT ?`,
    [kw, kw, limit]
  );

  const [pages] = await pool.query(
    `SELECT id, title, nav_name, cover_image, 'page' AS type FROM nuoyuan_page
     WHERE status = 1 AND (title LIKE ? OR nav_name LIKE ?) ORDER BY id DESC LIMIT ?`,
    [kw, kw, limit]
  );

  return { products, news, pages };
}

module.exports = { search };
