const pool = require('../config/db');
const { buildTree } = require('../utils/tree');

async function getPublicNavTree() {
  const [rows] = await pool.query(
    'SELECT id, parent_id, name, en_name, page_id, link_url, target, dropdown_banner, sort FROM nuoyuan_nav WHERE status = 1 ORDER BY sort ASC, id ASC'
  );
  return buildTree(rows);
}

async function getAllNav() {
  const [rows] = await pool.query('SELECT * FROM nuoyuan_nav ORDER BY sort ASC, id ASC');
  return buildTree(rows);
}

async function getNavById(id) {
  const [rows] = await pool.query('SELECT * FROM nuoyuan_nav WHERE id = ?', [id]);
  return rows[0] || null;
}

async function createNav(data) {
  const { parent_id = 0, name, en_name, page_id, link_url, target = '_self', dropdown_banner, sort = 0, status = 1 } = data;
  const [result] = await pool.query(
    'INSERT INTO nuoyuan_nav (parent_id, name, en_name, page_id, link_url, target, dropdown_banner, sort, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [parent_id, name, en_name || null, page_id || null, link_url || null, target, dropdown_banner || null, sort, status]
  );
  return getNavById(result.insertId);
}

async function updateNav(id, data) {
  const fields = [];
  const values = [];
  const allowed = ['parent_id', 'name', 'en_name', 'page_id', 'link_url', 'target', 'dropdown_banner', 'sort', 'status'];
  allowed.forEach((key) => {
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(data[key]);
    }
  });
  if (fields.length === 0) return getNavById(id);
  values.push(id);
  await pool.query(`UPDATE nuoyuan_nav SET ${fields.join(', ')} WHERE id = ?`, values);
  return getNavById(id);
}

async function deleteNav(id) {
  const [children] = await pool.query('SELECT id FROM nuoyuan_nav WHERE parent_id = ?', [id]);
  if (children.length > 0) {
    const err = new Error('请先删除子导航');
    err.name = 'ValidationError';
    throw err;
  }
  await pool.query('DELETE FROM nuoyuan_nav WHERE id = ?', [id]);
}

async function reorderNav(orderIds = []) {
  for (let i = 0; i < orderIds.length; i += 1) {
    await pool.query('UPDATE nuoyuan_nav SET sort = ? WHERE id = ?', [i, orderIds[i]]);
  }
}

module.exports = { getPublicNavTree, getAllNav, getNavById, createNav, updateNav, deleteNav, reorderNav };
