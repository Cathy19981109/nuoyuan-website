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

function parseInquiryEmails(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map((e) => String(e || '').trim()).filter(Boolean).slice(0, 10);
  }
  const text = String(raw).trim();
  if (!text) return [];
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      return parsed.map((e) => String(e || '').trim()).filter(Boolean).slice(0, 10);
    }
  } catch {
    // fall through: comma/semicolon/newline separated
  }
  return text
    .split(/[,;\n]+/)
    .map((e) => e.trim())
    .filter(Boolean)
    .slice(0, 10);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

async function getInquiryNotifyEmails() {
  const raw = await getConfigValue('inquiry_emails');
  let list = parseInquiryEmails(raw);
  if (!list.length) {
    // 兼容旧单邮箱配置
    const legacy = await getConfigValue('inquiry_email');
    list = parseInquiryEmails(legacy);
  }
  return list;
}

async function setInquiryNotifyEmails(emails = []) {
  const cleaned = parseInquiryEmails(emails);
  for (const email of cleaned) {
    if (!isValidEmail(email)) {
      const err = new Error(`邮箱格式不正确：${email}`);
      err.name = 'ValidationError';
      throw err;
    }
  }
  if (cleaned.length > 10) {
    const err = new Error('最多添加 10 个接收邮箱');
    err.name = 'ValidationError';
    throw err;
  }
  const existing = await getConfigByKey('inquiry_emails');
  if (existing) {
    await pool.query(
      'UPDATE nuoyuan_config SET config_value = ?, name = ?, description = ? WHERE config_key = ?',
      [JSON.stringify(cleaned), '询价接收邮箱', '最多10个接收邮箱，JSON数组', 'inquiry_emails']
    );
  } else {
    await pool.query(
      'INSERT INTO nuoyuan_config (config_key, config_value, name, description, sort) VALUES (?, ?, ?, ?, ?)',
      ['inquiry_emails', JSON.stringify(cleaned), '询价接收邮箱', '最多10个接收邮箱，JSON数组', 10]
    );
  }
  return getInquiryNotifyEmails();
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatSubmitTime(value) {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString('zh-CN', { hour12: false });
}

function parseCustomFormData(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'object') {
    return Object.entries(raw).map(([label, value]) => ({ label, value }));
  }
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && typeof parsed === 'object') {
      return Object.entries(parsed).map(([label, value]) => ({ label, value }));
    }
  } catch {
    return [];
  }
  return [];
}

function buildInquiryEmailContent(inquiry = {}) {
  const customRows = parseCustomFormData(inquiry.custom_form_data)
    .map((item) => ({
      label: String(item?.label || item?.name || '').trim() || '补充字段',
      value: String(item?.value ?? '').trim(),
    }))
    .filter((item) => item.value);

  const fields = [
    { label: '询价编号', value: inquiry.id != null ? `#${inquiry.id}` : '' },
    { label: '联系人', value: inquiry.name },
    { label: '联系电话', value: inquiry.phone },
    { label: '联系邮箱', value: inquiry.email },
    { label: '公司/单位', value: inquiry.company },
    { label: '咨询产品/服务', value: inquiry.product_name },
    { label: '产品/服务ID', value: inquiry.product_id },
    { label: '需求描述', value: inquiry.demand },
    ...customRows,
    { label: '提交时间', value: formatSubmitTime(inquiry.submit_time) },
  ].filter((item) => String(item.value ?? '').trim() !== '');

  const textLines = [
    '【诺元智合官网】完整询价信息',
    '================================',
    ...fields.map((item) => `${item.label}：${String(item.value).replace(/\r?\n/g, '\n')}`),
    '================================',
    '以上为用户提交的完整询价内容，请及时跟进。',
  ];

  const rowsHtml = fields
    .map((item) => {
      const isMultiline = String(item.value).includes('\n') || item.label === '需求描述';
      const valueHtml = isMultiline
        ? `<div style="white-space:pre-wrap;line-height:1.7;margin:0;">${escapeHtml(item.value)}</div>`
        : escapeHtml(item.value);
      return `
        <tr>
          <td style="padding:10px 12px;border:1px solid #e2e8f0;background:#f8fafc;width:140px;font-weight:600;color:#0f172a;vertical-align:top;">${escapeHtml(item.label)}</td>
          <td style="padding:10px 12px;border:1px solid #e2e8f0;color:#334155;vertical-align:top;">${valueHtml}</td>
        </tr>`;
    })
    .join('');

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;color:#0f172a;line-height:1.6;">
      <h2 style="margin:0 0 8px;font-size:20px;color:#0b2d5c;">完整询价信息</h2>
      <p style="margin:0 0 16px;color:#64748b;font-size:13px;">以下为用户在官网提交的全部询价内容，请直接据此跟进。</p>
      <table style="border-collapse:collapse;width:100%;max-width:720px;font-size:14px;">
        ${rowsHtml}
      </table>
    </div>
  `;

  return {
    subject: `【询价详情】${inquiry.name || '客户'} - ${inquiry.product_name || '产品/服务咨询'}${inquiry.id != null ? ` #${inquiry.id}` : ''}`,
    text: textLines.join('\n'),
    html,
  };
}

async function sendInquiryEmail(inquiry) {
  const smtpHost = await getConfigValue('smtp_host');
  const smtpPort = await getConfigValue('smtp_port');
  const smtpUser = await getConfigValue('smtp_user');
  const smtpPass = await getConfigValue('smtp_pass');
  const recipients = await getInquiryNotifyEmails();

  if (!smtpHost || !smtpUser || !smtpPass || !recipients.length) {
    return { sent: false, reason: '邮件配置不完整，询价已保存但未发送邮件' };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort, 10) || 465,
      secure: (parseInt(smtpPort, 10) || 465) === 465,
      auth: { user: smtpUser, pass: smtpPass },
    });

    const content = buildInquiryEmailContent(inquiry);

    await transporter.sendMail({
      from: `"诺元智合官网" <${smtpUser}>`,
      to: recipients.join(', '),
      subject: content.subject,
      text: content.text,
      html: content.html,
    });

    return { sent: true, recipients };
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
  getInquiryNotifyEmails,
  setInquiryNotifyEmails,
};
