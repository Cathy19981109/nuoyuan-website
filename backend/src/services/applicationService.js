const pool = require('../config/db');
const { paginate } = require('../utils/response');

async function getPublicApplications() {
  const [rows] = await pool.query(
    'SELECT id, name, description, icon, cover_image, sort FROM nuoyuan_application WHERE status = 1 ORDER BY sort ASC, id ASC'
  );
  return rows;
}

async function getPublicApplication(id) {
  const [rows] = await pool.query(
    'SELECT * FROM nuoyuan_application WHERE id = ? AND status = 1',
    [id]
  );
  return rows[0] || null;
}

async function getAdminApplications({ status, keyword, page = 1, pageSize = 20 }) {
  const offset = (page - 1) * pageSize;
  const conditions = [];
  const params = [];

  if (status !== undefined && status !== '') {
    conditions.push('status = ?');
    params.push(status);
  }
  if (keyword) {
    conditions.push('(name LIKE ? OR description LIKE ?)');
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const [countRows] = await pool.query(`SELECT COUNT(*) AS total FROM nuoyuan_application ${where}`, params);
  const total = countRows[0].total;

  const [rows] = await pool.query(
    `SELECT * FROM nuoyuan_application ${where} ORDER BY sort ASC, id DESC LIMIT ? OFFSET ?`,
    [...params, parseInt(pageSize, 10), offset]
  );

  return paginate(rows, total, page, pageSize);
}

async function getApplicationById(id) {
  const [rows] = await pool.query('SELECT * FROM nuoyuan_application WHERE id = ?', [id]);
  return rows[0] || null;
}

async function createApplication(data) {
  const { name, description, icon, cover_image, content, sort = 0, status = 1 } = data;
  const [result] = await pool.query(
    'INSERT INTO nuoyuan_application (name, description, icon, cover_image, content, sort, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [name, description || null, icon || null, cover_image || null, content || null, sort, status]
  );
  return getApplicationById(result.insertId);
}

async function updateApplication(id, data) {
  const fields = [];
  const values = [];
  const allowed = ['name', 'description', 'icon', 'cover_image', 'content', 'sort', 'status'];
  allowed.forEach((key) => {
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(data[key]);
    }
  });
  if (fields.length === 0) return getApplicationById(id);
  values.push(id);
  await pool.query(`UPDATE nuoyuan_application SET ${fields.join(', ')} WHERE id = ?`, values);
  return getApplicationById(id);
}

async function deleteApplication(id) {
  await pool.query('DELETE FROM nuoyuan_application WHERE id = ?', [id]);
}

module.exports = {
  getPublicApplications,
  getPublicApplication,
  getAdminApplications,
  getApplicationById,
  createApplication,
  updateApplication,
  deleteApplication,
};
