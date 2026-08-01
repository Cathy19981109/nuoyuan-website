const pool = require('../config/db');

function toNavRow(row) {
  if (!row) return null
  return {
    ...row,
    children: [],
  }
}

async function getPublicNavTree() {
  const [rows] = await pool.query(
    'SELECT id, parent_id, name, en_name, page_id, link_url, target, sort FROM nuoyuan_nav WHERE status = 1 AND parent_id = 0 ORDER BY sort ASC, id ASC'
  );
  return rows.map(toNavRow);
}

async function getAllNav() {
  const [rows] = await pool.query(
    'SELECT * FROM nuoyuan_nav WHERE parent_id = 0 ORDER BY sort ASC, id ASC'
  );
  return rows.map(toNavRow);
}

async function getNavById(id) {
  const [rows] = await pool.query('SELECT * FROM nuoyuan_nav WHERE id = ?', [id]);
  return rows[0] || null;
}

async function createNav(data) {
  const { name, en_name, page_id, link_url, target = '_self', sort = 0, status = 1 } = data;
  if (data.parent_id && Number(data.parent_id) !== 0) {
    const err = new Error('已取消导航下拉子菜单，仅支持顶级导航');
    err.name = 'ValidationError';
    throw err;
  }
  const [result] = await pool.query(
    'INSERT INTO nuoyuan_nav (parent_id, name, en_name, page_id, link_url, target, sort, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [0, name, en_name || null, page_id || null, link_url || null, target, sort, status]
  );
  return getNavById(result.insertId);
}

async function updateNav(id, data) {
  const fields = [];
  const values = [];
  const allowed = ['name', 'en_name', 'page_id', 'link_url', 'target', 'sort', 'status'];
  if (data.parent_id !== undefined && Number(data.parent_id) !== 0) {
    const err = new Error('已取消导航下拉子菜单，仅支持顶级导航');
    err.name = 'ValidationError';
    throw err;
  }
  allowed.forEach((key) => {
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(data[key]);
    }
  });
  // Always keep top-level if parent_id is sent
  if (data.parent_id !== undefined) {
    fields.push('parent_id = ?');
    values.push(0);
  }
  if (fields.length === 0) return getNavById(id);
  values.push(id);
  await pool.query(`UPDATE nuoyuan_nav SET ${fields.join(', ')} WHERE id = ?`, values);
  return getNavById(id);
}

async function deleteNav(id) {
  await pool.query('DELETE FROM nuoyuan_nav WHERE id = ?', [id]);
}

async function reorderNav(orderIds = []) {
  for (let i = 0; i < orderIds.length; i += 1) {
    await pool.query('UPDATE nuoyuan_nav SET sort = ? WHERE id = ?', [i, orderIds[i]]);
  }
}

/** Remove legacy submenu rows used by the old dropdown. */
async function purgeDropdownChildren() {
  const [result] = await pool.query('DELETE FROM nuoyuan_nav WHERE parent_id <> 0');
  return result.affectedRows || 0;
}

module.exports = {
  getPublicNavTree,
  getAllNav,
  getNavById,
  createNav,
  updateNav,
  deleteNav,
  reorderNav,
  purgeDropdownChildren,
};
