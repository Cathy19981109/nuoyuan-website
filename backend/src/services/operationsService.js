const pool = require('../config/db');

const SITE_CENTER_GROUPS = [
  {
    key: 'site_base',
    title: '官网信息',
    items: [
      {
        label: '品牌Logo',
        key: 'brand_logo',
        inputType: 'image',
        required: true,
        tips: '请上传包含品牌名的 Logo 图片（透明底 PNG 更佳）。头部将仅展示该图片，不再单独显示文字品牌名。',
        uploadRule: '推荐透明底 PNG，横向构图（图标+品牌名），建议高度 80–120px、宽度自适应，png/jpg/webp，<=50MB',
      },
      {
        label: '底部版权文字',
        key: 'footer_copyright',
        inputType: 'text',
        maxLength: 100,
      },
      {
        label: 'ICP备案号',
        key: 'icp_no',
        inputType: 'text',
        maxLength: 50,
      },
    ],
  },
  {
    key: 'site_email',
    title: '发信邮箱（SMTP）',
    items: [
      {
        label: 'SMTP服务器',
        key: 'smtp_host',
        inputType: 'text',
        maxLength: 100,
        tips: '发信服务器地址，如 smtp.qq.com、smtp.163.com、smtp.exmail.qq.com',
      },
      {
        label: 'SMTP端口',
        key: 'smtp_port',
        inputType: 'number',
        maxLength: 5,
        tips: '常见：465（SSL）或 587（STARTTLS）',
      },
      {
        label: 'SMTP账号',
        key: 'smtp_user',
        inputType: 'text',
        maxLength: 100,
        tips: '用于发信的邮箱账号（一般即完整邮箱地址）',
      },
      {
        label: 'SMTP密码/授权码',
        key: 'smtp_pass',
        inputType: 'password',
        maxLength: 200,
        tips: '邮箱密码或服务商提供的「授权码」（QQ/163 等通常需在邮箱设置中开启 SMTP 并生成授权码）',
      },
    ],
  },
];

async function getConfigValue(key) {
  const [rows] = await pool.query('SELECT config_value FROM nuoyuan_config WHERE config_key = ?', [key]);
  return rows[0]?.config_value || '';
}

async function setConfigValue(key, value, name = key, description = '') {
  const [rows] = await pool.query('SELECT id FROM nuoyuan_config WHERE config_key = ?', [key]);
  if (rows.length) {
    await pool.query('UPDATE nuoyuan_config SET config_value = ? WHERE config_key = ?', [value, key]);
  } else {
    await pool.query(
      'INSERT INTO nuoyuan_config (config_key, config_value, name, description, sort) VALUES (?, ?, ?, ?, 0)',
      [key, value, name, description]
    );
  }
}

async function getSiteCenter() {
  const groups = [];
  for (const group of SITE_CENTER_GROUPS) {
    const items = [];
    for (const item of group.items) {
      const value = await getConfigValue(item.key);
      items.push({
        key: item.key,
        label: item.label,
        inputType: item.inputType,
        value: value || '',
        required: !!item.required,
        maxLength: item.maxLength || null,
        tips: item.tips || '',
        uploadRule: item.uploadRule || '',
      });
    }
    groups.push({ title: group.title, key: group.key, items });
  }
  return groups;
}

async function updateSiteCenter(payload = {}) {
  const byKey = {};
  SITE_CENTER_GROUPS.forEach((g) => {
    g.items.forEach((item) => {
      byKey[item.key] = item;
    });
  });
  const entries = Object.entries(payload);
  for (const [key, rawValue] of entries) {
    if (!byKey[key]) continue;
    let value = rawValue;
    if (key === 'footer_copyright' && typeof value === 'string') {
      value = value.slice(0, 100);
    }
    await setConfigValue(key, value || '', byKey[key].label, byKey[key].tips || byKey[key].uploadRule || '');
  }
  const logo = Object.prototype.hasOwnProperty.call(payload, 'brand_logo')
    ? String(payload.brand_logo || '').trim()
    : String(await getConfigValue('brand_logo') || '').trim();
  if (!logo) {
    const err = new Error('请上传品牌 Logo（需包含品牌名的图片）');
    err.name = 'ValidationError';
    throw err;
  }
  return getSiteCenter();
}

async function getFooterBlocks() {
  const [rows] = await pool.query('SELECT * FROM nuoyuan_footer_block ORDER BY sort ASC, id ASC');
  return rows.map((row) => ({
    ...row,
    links_json: row.links_json ? JSON.parse(row.links_json) : [],
  }));
}

async function createFooterBlock(data) {
  const [result] = await pool.query(
    `INSERT INTO nuoyuan_footer_block (title, layout_type, links_json, qrcode_image, copyright_text, sort, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      data.title,
      data.layout_type || 1,
      JSON.stringify(data.links || []),
      data.qrcode_image || null,
      (data.copyright_text || '').slice(0, 100) || null,
      data.sort || 0,
      data.status === 0 ? 0 : 1,
    ]
  );
  const [rows] = await pool.query('SELECT * FROM nuoyuan_footer_block WHERE id = ?', [result.insertId]);
  return rows[0];
}

async function updateFooterBlock(id, data) {
  const fields = [];
  const values = [];
  if (data.title !== undefined) {
    fields.push('title = ?');
    values.push(data.title);
  }
  if (data.layout_type !== undefined) {
    fields.push('layout_type = ?');
    values.push(data.layout_type);
  }
  if (data.links !== undefined) {
    fields.push('links_json = ?');
    values.push(JSON.stringify(data.links || []));
  }
  if (data.qrcode_image !== undefined) {
    fields.push('qrcode_image = ?');
    values.push(data.qrcode_image || null);
  }
  if (data.copyright_text !== undefined) {
    fields.push('copyright_text = ?');
    values.push((data.copyright_text || '').slice(0, 100) || null);
  }
  if (data.sort !== undefined) {
    fields.push('sort = ?');
    values.push(data.sort);
  }
  if (data.status !== undefined) {
    fields.push('status = ?');
    values.push(data.status);
  }
  if (fields.length) {
    values.push(id);
    await pool.query(`UPDATE nuoyuan_footer_block SET ${fields.join(', ')} WHERE id = ?`, values);
  }
  const [rows] = await pool.query('SELECT * FROM nuoyuan_footer_block WHERE id = ?', [id]);
  return rows[0] || null;
}

async function deleteFooterBlock(id) {
  await pool.query('DELETE FROM nuoyuan_footer_block WHERE id = ?', [id]);
}

async function getInquiryFormTemplate() {
  const [rows] = await pool.query(
    'SELECT * FROM nuoyuan_inquiry_form_template WHERE status = 1 ORDER BY is_default DESC, id ASC LIMIT 1'
  );
  if (!rows[0]) return null;
  return {
    ...rows[0],
    schema_json: rows[0].schema_json ? JSON.parse(rows[0].schema_json) : [],
  };
}

async function saveInquiryFormTemplate(payload) {
  const { name = '默认询价表单', schema = [] } = payload;
  const existing = await getInquiryFormTemplate();
  if (existing) {
    await pool.query(
      'UPDATE nuoyuan_inquiry_form_template SET name = ?, schema_json = ?, updated_at = NOW() WHERE id = ?',
      [name, JSON.stringify(schema), existing.id]
    );
  } else {
    await pool.query(
      'INSERT INTO nuoyuan_inquiry_form_template (name, is_default, schema_json, status) VALUES (?, 1, ?, 1)',
      [name, JSON.stringify(schema)]
    );
  }
  return getInquiryFormTemplate();
}

async function getStatsDashboard({ startDate, endDate }) {
  const from = startDate || '1970-01-01';
  const to = endDate || '2099-12-31';

  const [traffic] = await pool.query(
    `SELECT stat_date, visit_count, visitor_count, source_json
     FROM nuoyuan_traffic_daily WHERE stat_date BETWEEN ? AND ? ORDER BY stat_date ASC`,
    [from, to]
  );

  const [productHot] = await pool.query(
    `SELECT p.id, p.product_code, p.name, p.view_count,
            (SELECT COUNT(*) FROM nuoyuan_inquiry i WHERE i.product_id = p.id) AS inquiry_count
     FROM nuoyuan_product p
     ORDER BY p.view_count DESC, p.id DESC
     LIMIT 20`
  );

  const [inquiryMonthly] = await pool.query(
    `SELECT DATE_FORMAT(submit_time, '%Y-%m') AS month, COUNT(*) AS inquiry_count
     FROM nuoyuan_inquiry
     WHERE submit_time BETWEEN ? AND DATE_ADD(?, INTERVAL 1 DAY)
     GROUP BY DATE_FORMAT(submit_time, '%Y-%m')
     ORDER BY month ASC`,
    [from, to]
  );

  const [inquiryByProduct] = await pool.query(
    `SELECT IFNULL(product_name, '未指定产品') AS product_name, COUNT(*) AS inquiry_count
     FROM nuoyuan_inquiry
     WHERE submit_time BETWEEN ? AND DATE_ADD(?, INTERVAL 1 DAY)
     GROUP BY IFNULL(product_name, '未指定产品')
     ORDER BY inquiry_count DESC`,
    [from, to]
  );

  return {
    trafficDaily: traffic.map((t) => ({
      ...t,
      source_json: t.source_json ? JSON.parse(t.source_json) : {},
    })),
    hotProducts: productHot,
    inquiryMonthly,
    inquiryByProduct,
  };
}

module.exports = {
  getSiteCenter,
  updateSiteCenter,
  getFooterBlocks,
  createFooterBlock,
  updateFooterBlock,
  deleteFooterBlock,
  getInquiryFormTemplate,
  saveInquiryFormTemplate,
  getStatsDashboard,
};
