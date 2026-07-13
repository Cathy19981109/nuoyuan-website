const pool = require('../config/db');
const { paginate } = require('../utils/response');

async function getPublicPage(id) {
  const [rows] = await pool.query(
    'SELECT id, title, nav_name, content, seo_keywords, seo_description, cover_image, updated_at FROM nuoyuan_page WHERE id = ? AND status = 1',
    [id]
  );
  return rows[0] || null;
}

async function getPublicPageByNavName(navName) {
  const [rows] = await pool.query(
    'SELECT id, title, nav_name, content, seo_keywords, seo_description, cover_image, updated_at FROM nuoyuan_page WHERE nav_name = ? AND status = 1',
    [navName]
  );
  return rows[0] || null;
}

async function getPageList({ page = 1, pageSize = 20, keyword, status }) {
  const offset = (page - 1) * pageSize;
  const conditions = [];
  const params = [];

  if (keyword) {
    conditions.push('(title LIKE ? OR nav_name LIKE ?)');
    params.push(`%${keyword}%`, `%${keyword}%`);
  }
  if (status !== undefined && status !== '') {
    conditions.push('status = ?');
    params.push(status);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const [countRows] = await pool.query(`SELECT COUNT(*) AS total FROM nuoyuan_page ${where}`, params);
  const total = countRows[0].total;

  const [rows] = await pool.query(
    `SELECT id, title, nav_name, seo_keywords, seo_description, cover_image, tab_sort, status, created_at, updated_at
     FROM nuoyuan_page ${where} ORDER BY tab_sort ASC, id ASC LIMIT ? OFFSET ?`,
    [...params, parseInt(pageSize, 10), offset]
  );

  return paginate(rows, total, page, pageSize);
}

async function getPageById(id) {
  const [rows] = await pool.query('SELECT * FROM nuoyuan_page WHERE id = ?', [id]);
  return rows[0] || null;
}

async function createPage(data) {
  const { title, nav_name, content, seo_keywords, seo_description, cover_image, tab_sort = 0, status = 1 } = data;
  const [result] = await pool.query(
    'INSERT INTO nuoyuan_page (title, nav_name, content, seo_keywords, seo_description, cover_image, tab_sort, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [title, nav_name, content || null, seo_keywords || null, seo_description || null, cover_image || null, tab_sort, status]
  );
  return getPageById(result.insertId);
}

async function updatePage(id, data) {
  const fields = [];
  const values = [];
  const allowed = ['title', 'nav_name', 'content', 'seo_keywords', 'seo_description', 'cover_image', 'tab_sort', 'status'];
  allowed.forEach((key) => {
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(data[key]);
    }
  });
  if (fields.length === 0) return getPageById(id);
  values.push(id);
  await pool.query(`UPDATE nuoyuan_page SET ${fields.join(', ')} WHERE id = ?`, values);
  return getPageById(id);
}

async function deletePage(id) {
  await pool.query('DELETE FROM nuoyuan_page WHERE id = ?', [id]);
}

module.exports = {
  getPublicPage,
  getPublicPageByNavName,
  getPageList,
  getPageById,
  createPage,
  updatePage,
  deletePage,
};
