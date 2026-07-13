const pool = require('../config/db');
const { paginate } = require('../utils/response');

async function getNewsNavChildren() {
  const [parents] = await pool.query(
    "SELECT id FROM nuoyuan_nav WHERE parent_id = 0 AND (name LIKE '%新闻%' OR IFNULL(link_url, '') LIKE '/news%') ORDER BY sort ASC, id ASC LIMIT 1"
  );
  if (!parents.length) return [];
  const parentId = parents[0].id;
  const [children] = await pool.query(
    'SELECT id, name, sort, status FROM nuoyuan_nav WHERE parent_id = ? ORDER BY sort ASC, id ASC',
    [parentId]
  );
  return children.map((row) => ({
    id: row.id,
    name: row.name,
    sort: row.sort,
    status: row.status,
    source: 'nav',
  }));
}

async function getPublicNewsCategories() {
  const navRows = await getNewsNavChildren();
  if (navRows.length) return navRows.filter((row) => Number(row.status) === 1);
  const [rows] = await pool.query(
    'SELECT id, name, sort FROM nuoyuan_news_category WHERE status = 1 ORDER BY sort ASC, id ASC'
  );
  return rows.map((row) => ({ ...row, source: 'legacy' }));
}

async function getAllNewsCategories() {
  const navRows = await getNewsNavChildren();
  if (navRows.length) return navRows;
  const [rows] = await pool.query('SELECT * FROM nuoyuan_news_category ORDER BY sort ASC, id ASC');
  return rows.map((row) => ({ ...row, source: 'legacy' }));
}

async function getNewsCategoryById(id) {
  const navRows = await getNewsNavChildren();
  if (navRows.length) {
    return navRows.find((row) => Number(row.id) === Number(id)) || null;
  }
  const [rows] = await pool.query('SELECT * FROM nuoyuan_news_category WHERE id = ?', [id]);
  return rows[0] || null;
}

async function createNewsCategory(data) {
  const navRows = await getNewsNavChildren();
  if (navRows.length) {
    const err = new Error('新闻分类来源于导航编辑，请前往「导航编辑-新闻动态」维护');
    err.name = 'ValidationError';
    throw err;
  }
  const { name, sort = 0, status = 1 } = data;
  const [result] = await pool.query(
    'INSERT INTO nuoyuan_news_category (name, sort, status) VALUES (?, ?, ?)',
    [name, sort, status]
  );
  return getNewsCategoryById(result.insertId);
}

async function updateNewsCategory(id, data) {
  const navRows = await getNewsNavChildren();
  if (navRows.length) {
    const err = new Error('新闻分类来源于导航编辑，请前往「导航编辑-新闻动态」维护');
    err.name = 'ValidationError';
    throw err;
  }
  const fields = [];
  const values = [];
  const allowed = ['name', 'sort', 'status'];
  allowed.forEach((key) => {
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(data[key]);
    }
  });
  if (fields.length === 0) return getNewsCategoryById(id);
  values.push(id);
  await pool.query(`UPDATE nuoyuan_news_category SET ${fields.join(', ')} WHERE id = ?`, values);
  return getNewsCategoryById(id);
}

async function deleteNewsCategory(id) {
  const navRows = await getNewsNavChildren();
  if (navRows.length) {
    const err = new Error('新闻分类来源于导航编辑，请前往「导航编辑-新闻动态」维护');
    err.name = 'ValidationError';
    throw err;
  }
  const [news] = await pool.query('SELECT id FROM nuoyuan_news WHERE category_id = ? LIMIT 1', [id]);
  if (news.length > 0) {
    const err = new Error('该分类下存在新闻，无法删除');
    err.name = 'ValidationError';
    throw err;
  }
  await pool.query('DELETE FROM nuoyuan_news_category WHERE id = ?', [id]);
}

async function getPublicNewsList({ categoryId, page = 1, pageSize = 10 }) {
  const offset = (page - 1) * pageSize;
  const conditions = ['status = 1'];
  const params = [];

  if (categoryId) {
    conditions.push('category_id = ?');
    params.push(categoryId);
  }

  const where = `WHERE ${conditions.join(' AND ')}`;
  const [countRows] = await pool.query(`SELECT COUNT(*) AS total FROM nuoyuan_news ${where}`, params);
  const total = countRows[0].total;

  const [rows] = await pool.query(
    `SELECT id, category_id, title, short_desc, cover_image, author, publish_time, is_top, view_count
     FROM nuoyuan_news ${where} ORDER BY is_top DESC, publish_time DESC, sort ASC LIMIT ? OFFSET ?`,
    [...params, parseInt(pageSize, 10), offset]
  );

  return paginate(rows, total, page, pageSize);
}

async function getAdminNewsList({ categoryId, status, keyword, page = 1, pageSize = 20 }) {
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
    conditions.push('(title LIKE ? OR short_desc LIKE ?)');
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const [countRows] = await pool.query(`SELECT COUNT(*) AS total FROM nuoyuan_news ${where}`, params);
  const total = countRows[0].total;

  const [rows] = await pool.query(
    `SELECT * FROM nuoyuan_news ${where} ORDER BY is_top DESC, publish_time DESC, id DESC LIMIT ? OFFSET ?`,
    [...params, parseInt(pageSize, 10), offset]
  );

  return paginate(rows, total, page, pageSize);
}

async function getPublicNews(id) {
  const [rows] = await pool.query(
    'SELECT * FROM nuoyuan_news WHERE id = ? AND status = 1',
    [id]
  );
  if (rows[0]) {
    await pool.query('UPDATE nuoyuan_news SET view_count = view_count + 1 WHERE id = ?', [id]);
    rows[0].view_count += 1;
  }
  return rows[0] || null;
}

async function getNewsById(id) {
  const [rows] = await pool.query('SELECT * FROM nuoyuan_news WHERE id = ?', [id]);
  return rows[0] || null;
}

async function createNews(data) {
  const {
    category_id, title, short_desc, content, cover_image, author = '诺元智合',
    publish_time, sort = 0, is_top = 0, status = 1,
  } = data;
  const [result] = await pool.query(
    `INSERT INTO nuoyuan_news (category_id, title, short_desc, content, cover_image, author, publish_time, sort, is_top, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [category_id, title, short_desc || null, content, cover_image || null, author, publish_time || new Date(), sort, is_top, status]
  );
  return getNewsById(result.insertId);
}

async function updateNews(id, data) {
  const fields = [];
  const values = [];
  const allowed = ['category_id', 'title', 'short_desc', 'content', 'cover_image', 'author', 'publish_time', 'sort', 'is_top', 'status'];
  allowed.forEach((key) => {
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(data[key]);
    }
  });
  if (fields.length === 0) return getNewsById(id);
  values.push(id);
  await pool.query(`UPDATE nuoyuan_news SET ${fields.join(', ')} WHERE id = ?`, values);
  return getNewsById(id);
}

async function deleteNews(id) {
  await pool.query('DELETE FROM nuoyuan_news WHERE id = ?', [id]);
}

async function reorderNews(orderIds = []) {
  for (let i = 0; i < orderIds.length; i += 1) {
    await pool.query('UPDATE nuoyuan_news SET sort = ? WHERE id = ?', [i, orderIds[i]]);
  }
}

async function reorderNewsCategories(orderIds = []) {
  const navRows = await getNewsNavChildren();
  if (navRows.length) {
    const err = new Error('新闻分类来源于导航编辑，请前往「导航编辑-新闻动态」维护');
    err.name = 'ValidationError';
    throw err;
  }
  for (let i = 0; i < orderIds.length; i += 1) {
    await pool.query('UPDATE nuoyuan_news_category SET sort = ? WHERE id = ?', [i, orderIds[i]]);
  }
}

module.exports = {
  getPublicNewsCategories,
  getAllNewsCategories,
  getNewsCategoryById,
  createNewsCategory,
  updateNewsCategory,
  deleteNewsCategory,
  getPublicNewsList,
  getAdminNewsList,
  getPublicNews,
  getNewsById,
  createNews,
  updateNews,
  deleteNews,
  reorderNews,
  reorderNewsCategories,
};
