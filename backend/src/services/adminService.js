const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { signToken } = require('../utils/jwt');

async function login(username, password, ip) {
  const [rows] = await pool.query(
    'SELECT * FROM nuoyuan_admin WHERE username = ? AND status = 1',
    [username]
  );
  const admin = rows[0];
  if (!admin) {
    const err = new Error('账号或密码错误');
    err.name = 'ValidationError';
    throw err;
  }

  const matched = await bcrypt.compare(password, admin.password);
  if (!matched) {
    const err = new Error('账号或密码错误');
    err.name = 'ValidationError';
    throw err;
  }

  await pool.query(
    'UPDATE nuoyuan_admin SET last_login_time = NOW(), last_login_ip = ? WHERE id = ?',
    [ip, admin.id]
  );

  const token = signToken({ id: admin.id, username: admin.username, role: admin.role });

  return {
    token,
    admin: {
      id: admin.id,
      username: admin.username,
      real_name: admin.real_name,
      role: admin.role,
    },
  };
}

async function getProfile(id) {
  const [rows] = await pool.query(
    'SELECT id, username, real_name, role, status, email, phone, last_login_time, last_login_ip, created_at FROM nuoyuan_admin WHERE id = ?',
    [id]
  );
  return rows[0] || null;
}

async function updateProfileBinding(id, email, phone) {
  await pool.query('UPDATE nuoyuan_admin SET email = ?, phone = ? WHERE id = ?', [email, phone, id]);
  return getProfile(id);
}

async function changePassword(id, oldPassword, newPassword) {
  const [rows] = await pool.query('SELECT password, email, phone FROM nuoyuan_admin WHERE id = ?', [id]);
  const admin = rows[0];
  if (!admin) {
    const err = new Error('管理员不存在');
    err.name = 'ValidationError';
    throw err;
  }

  if (!admin.email || !admin.phone) {
    const err = new Error('请先在权限管理中绑定邮箱和手机号，再修改密码');
    err.name = 'ValidationError';
    throw err;
  }

  const matched = await bcrypt.compare(oldPassword, admin.password);
  if (!matched) {
    const err = new Error('原密码错误');
    err.name = 'ValidationError';
    throw err;
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  await pool.query('UPDATE nuoyuan_admin SET password = ? WHERE id = ?', [hashed, id]);
}

module.exports = { login, getProfile, updateProfileBinding, changePassword };
