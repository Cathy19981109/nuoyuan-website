const pool = require('../config/db');
const nodemailer = require('nodemailer');
const { paginate } = require('../utils/response');
const operationsService = require('./operationsService');

async function getConfigValue(key) {
  const [rows] = await pool.query('SELECT config_value FROM nuoyuan_config WHERE config_key = ?', [key]);
  return rows[0]?.config_value || null;
}

async function getPublicConfigs() {
  const publicKeys = [
    'site_name',
    'site_logo',
    'brand_logo',
    'brand_title',
    'contact_phone',
    'contact_email',
    'contact_address',
    'contact_map_note',
    'contact_map_embed_url',
    'contact_map_nav_url',
    'online_consult_url',
    'icp_no',
    'seo_global_keywords',
    'seo_global_description',
    'seo_home_title',
    'seo_share_img',
    'footer_copyright',
  ];
  const [rows] = await pool.query(
    `SELECT config_key, config_value, name FROM nuoyuan_config WHERE config_key IN (${publicKeys.map(() => '?').join(',')}) ORDER BY sort ASC`,
    publicKeys
  );
  const result = {};
  rows.forEach((row) => {
    result[row.config_key] = row.config_value;
  });
  const [footerBlocks] = await pool.query(
    'SELECT id, title, layout_type, links_json, qrcode_image, copyright_text, sort FROM nuoyuan_footer_block WHERE status = 1 ORDER BY sort ASC, id ASC'
  );
  result.footer_blocks = footerBlocks.map((row) => ({
    ...row,
    links_json: row.links_json ? JSON.parse(row.links_json) : [],
  }));
  return result;
}

async function getAllConfigs() {
  const [rows] = await pool.query('SELECT * FROM nuoyuan_config ORDER BY sort ASC, id ASC');
  return rows;
}

async function getConfigByKey(key) {
  const [rows] = await pool.query('SELECT * FROM nuoyuan_config WHERE config_key = ?', [key]);
  return rows[0] || null;
}

async function upsertConfig(data) {
  const { config_key, config_value, name, description, sort = 0 } = data;
  const existing = await getConfigByKey(config_key);
  if (existing) {
    await pool.query(
      'UPDATE nuoyuan_config SET config_value = ?, name = ?, description = ?, sort = ? WHERE config_key = ?',
      [config_value, name || existing.name, description || existing.description, sort, config_key]
    );
  } else {
    await pool.query(
      'INSERT INTO nuoyuan_config (config_key, config_value, name, description, sort) VALUES (?, ?, ?, ?, ?)',
      [config_key, config_value, name, description || null, sort]
    );
  }
  return getConfigByKey(config_key);
}

async function updateConfig(id, data) {
  const fields = [];
  const values = [];
  const allowed = ['config_value', 'name', 'description', 'sort'];
  allowed.forEach((key) => {
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(data[key]);
    }
  });
  if (fields.length === 0) {
    const [rows] = await pool.query('SELECT * FROM nuoyuan_config WHERE id = ?', [id]);
    return rows[0] || null;
  }
  values.push(id);
  await pool.query(`UPDATE nuoyuan_config SET ${fields.join(', ')} WHERE id = ?`, values);
  const [rows] = await pool.query('SELECT * FROM nuoyuan_config WHERE id = ?', [id]);
  return rows[0] || null;
}

async function sendInquiryEmail(inquiry) {
  const smtpHost = await getConfigValue('smtp_host');
  const smtpPort = await getConfigValue('smtp_port');
  const smtpUser = await getConfigValue('smtp_user');
  const smtpPass = await getConfigValue('smtp_pass');
  const inquiryEmail = await getConfigValue('inquiry_email');

  if (!smtpHost || !smtpUser || !smtpPass || !inquiryEmail) {
    return { sent: false, reason: '邮件配置不完整，询价已保存但未发送邮件' };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort, 10) || 465,
      secure: (parseInt(smtpPort, 10) || 465) === 465,
      auth: { user: smtpUser, pass: smtpPass },
    });

    const html = `
      <h2>新的询价信息</h2>
      <p><strong>联系人：</strong>${inquiry.name}</p>
      <p><strong>电话：</strong>${inquiry.phone}</p>
      <p><strong>邮箱：</strong>${inquiry.email || '未填写'}</p>
      <p><strong>公司/单位：</strong>${inquiry.company || '未填写'}</p>
      <p><strong>咨询产品：</strong>${inquiry.product_name || '未指定'}</p>
      <p><strong>需求描述：</strong></p>
      <p>${inquiry.demand}</p>
      <p><strong>提交时间：</strong>${inquiry.submit_time}</p>
    `;

    await transporter.sendMail({
      from: `"诺元智合官网" <${smtpUser}>`,
      to: inquiryEmail,
      subject: `【询价】${inquiry.name} - ${inquiry.product_name || '产品咨询'}`,
      html,
    });

    return { sent: true };
  } catch (err) {
    console.error('[Email Error]', err.message);
    return { sent: false, reason: '邮件发送失败，询价已保存' };
  }
}

async function createInquiry(data) {
  const { name, phone, email, company, product_id, product_name, demand, custom_form_data } = data;
  const [result] = await pool.query(
    `INSERT INTO nuoyuan_inquiry (name, phone, email, company, product_id, product_name, demand)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [name, phone, email || null, company || null, product_id || null, product_name || null, demand]
  );
  if (custom_form_data) {
    await pool.query('UPDATE nuoyuan_inquiry SET custom_form_data = ? WHERE id = ?', [JSON.stringify(custom_form_data), result.insertId]);
  }

  const [rows] = await pool.query('SELECT * FROM nuoyuan_inquiry WHERE id = ?', [result.insertId]);
  const inquiry = rows[0];
  const emailResult = await sendInquiryEmail(inquiry);

  return { inquiry, emailResult };
}

async function exportInquiryRows({ ids = [] }) {
  let rows = [];
  if (ids.length) {
    const placeholders = ids.map(() => '?').join(',');
    const [data] = await pool.query(`SELECT * FROM nuoyuan_inquiry WHERE id IN (${placeholders}) ORDER BY submit_time DESC`, ids);
    rows = data;
  } else {
    const [data] = await pool.query('SELECT * FROM nuoyuan_inquiry ORDER BY submit_time DESC LIMIT 1000');
    rows = data;
  }
  return rows.map((row) => ({
    编号: row.id,
    提交时间: row.submit_time,
    联系人: row.name,
    联系电话: row.phone,
    联系邮箱: row.email || '',
    单位名称: row.company || '',
    咨询产品: row.product_name || '',
    需求描述: row.demand || '',
    处理状态: ['待联系', '已沟通', '已跟进', '已成交'][row.status] || '待联系',
    处理备注: row.handle_note || '',
    自定义表单内容: row.custom_form_data || '',
  }));
}

async function getPublicInquiryForm() {
  return operationsService.getInquiryFormTemplate();
}

async function getInquiryList({ status, keyword, page = 1, pageSize = 20 }) {
  const offset = (page - 1) * pageSize;
  const conditions = [];
  const params = [];

  if (status !== undefined && status !== '') {
    conditions.push('status = ?');
    params.push(status);
  }
  if (keyword) {
    conditions.push('(name LIKE ? OR phone LIKE ? OR email LIKE ? OR company LIKE ? OR product_name LIKE ? OR CAST(product_id AS CHAR) LIKE ?)');
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const [countRows] = await pool.query(`SELECT COUNT(*) AS total FROM nuoyuan_inquiry ${where}`, params);
  const total = countRows[0].total;

  const [rows] = await pool.query(
    `SELECT * FROM nuoyuan_inquiry ${where} ORDER BY submit_time DESC LIMIT ? OFFSET ?`,
    [...params, parseInt(pageSize, 10), offset]
  );

  return paginate(rows, total, page, pageSize);
}

async function getInquiryListAdvanced({
  status,
  name,
  phone,
  email,
  company,
  productKeyword,
  page = 1,
  pageSize = 20,
}) {
  const offset = (page - 1) * pageSize;
  const conditions = [];
  const params = [];

  if (status !== undefined && status !== '') {
    conditions.push('status = ?');
    params.push(status);
  }
  if (name) {
    conditions.push('name LIKE ?');
    params.push(`%${name}%`);
  }
  if (phone) {
    conditions.push('phone LIKE ?');
    params.push(`%${phone}%`);
  }
  if (email) {
    conditions.push('email LIKE ?');
    params.push(`%${email}%`);
  }
  if (company) {
    conditions.push('company LIKE ?');
    params.push(`%${company}%`);
  }
  if (productKeyword) {
    conditions.push('(product_name LIKE ? OR CAST(product_id AS CHAR) LIKE ?)');
    params.push(`%${productKeyword}%`, `%${productKeyword}%`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const [countRows] = await pool.query(`SELECT COUNT(*) AS total FROM nuoyuan_inquiry ${where}`, params);
  const total = countRows[0].total;
  const [rows] = await pool.query(
    `SELECT * FROM nuoyuan_inquiry ${where} ORDER BY submit_time DESC LIMIT ? OFFSET ?`,
    [...params, parseInt(pageSize, 10), offset]
  );

  return paginate(rows, total, page, pageSize);
}

async function getInquiryById(id) {
  const [rows] = await pool.query('SELECT * FROM nuoyuan_inquiry WHERE id = ?', [id]);
  return rows[0] || null;
}

async function handleInquiry(id, adminId, data) {
  const { status, handle_note } = data;
  await pool.query(
    'UPDATE nuoyuan_inquiry SET status = ?, handle_note = ?, handle_time = NOW(), handle_admin_id = ? WHERE id = ?',
    [status, handle_note || null, adminId, id]
  );
  return getInquiryById(id);
}

async function deleteInquiry(id) {
  await pool.query('DELETE FROM nuoyuan_inquiry WHERE id = ?', [id]);
}

module.exports = {
  getPublicConfigs,
  getAllConfigs,
  getConfigByKey,
  upsertConfig,
  updateConfig,
  createInquiry,
  getInquiryList,
  getInquiryById,
  handleInquiry,
  deleteInquiry,
  exportInquiryRows,
  getPublicInquiryForm,
  getInquiryListAdvanced,
};
