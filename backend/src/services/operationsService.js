const pool = require('../config/db');

const SITE_CENTER_GROUPS = [
  {
    key: 'site_publish',
    title: '网站开放',
    items: [
      {
        label: '对外开放',
        key: 'site_public_open',
        inputType: 'select',
        options: [
          { value: '0', label: '关闭（仅后台可编辑，前台显示「即将上线」）' },
          { value: '1', label: '开放（访客可正常浏览官网）' },
        ],
        tips: '建议内容编辑完成后再改为「开放」。关闭期间可通过「前台预览」查看效果，不影响访客看到的关闭页。',
      },
    ],
  },
  {
    key: 'site_base',
    title: '官网信息',
    items: [
      {
        label: '纯图片 Logo',
        key: 'icon_logo',
        inputType: 'image',
        required: true,
        tips: '显示位置：浏览器标签页缩略图（favicon），前台与管理后台共用。请上传不含文字的图标（透明底 PNG 更佳，建议正方形）。',
        uploadRule: '推荐透明底 PNG，1:1 构图，建议 128×128～512×512，png/jpg/webp，<=50MB',
      },
      {
        label: '文字 Logo',
        key: 'brand_logo',
        inputType: 'image',
        required: true,
        tips: '显示位置：网站页面左上角（顶部导航栏品牌位），页脚品牌区同步使用。请上传含品牌名的 Logo（头部深色背景，建议白色字体）。',
        uploadRule: '推荐透明底 PNG + 白色品牌字，横向构图，建议高度 80–160px、宽度自适应，png/jpg/webp，<=50MB',
      },
    ],
  },
  {
    key: 'footer_meta',
    title: '页脚底栏',
    items: [
      {
        label: '底部版权文字',
        key: 'footer_copyright',
        inputType: 'text',
        maxLength: 200,
        tips: '如：© 2026 诺元智合 NUOYUAN BIOTECH. All rights reserved.',
      },
      {
        label: 'ICP备案号',
        key: 'icp_no',
        inputType: 'text',
        maxLength: 50,
        tips: '如：苏ICP备xxxxxxxx号-1，将显示在页脚并链接至工信部备案查询',
      },
      {
        label: '公安备案号',
        key: 'footer_police_beian',
        inputType: 'text',
        maxLength: 80,
        tips: '如：苏公网安备 xxxxxxxxxx号（选填）',
      },
      {
        label: '营业执照文案',
        key: 'footer_license_text',
        inputType: 'text',
        maxLength: 40,
        tips: '如：营业执照（选填）',
      },
      {
        label: '营业执照链接',
        key: 'footer_license_url',
        inputType: 'text',
        maxLength: 300,
        tips: '点击「营业执照」跳转的地址（选填）',
      },
      {
        label: '底栏补充说明',
        key: 'footer_region_note',
        inputType: 'text',
        maxLength: 100,
        tips: '如：本网站所有信息仅针对中国地区客户（选填）',
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
        value: value || (item.key === 'site_public_open' ? '0' : ''),
        required: !!item.required,
        maxLength: item.maxLength || null,
        tips: item.tips || '',
        uploadRule: item.uploadRule || '',
        options: item.options || null,
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
      value = value.slice(0, byKey[key].maxLength || 200);
    }
    if (key === 'icp_no' && typeof value === 'string') {
      value = value.slice(0, byKey[key].maxLength || 50);
    }
    if (key === 'footer_police_beian' && typeof value === 'string') {
      value = value.slice(0, byKey[key].maxLength || 80);
    }
    if (key === 'footer_license_text' && typeof value === 'string') {
      value = value.slice(0, byKey[key].maxLength || 40);
    }
    if (key === 'footer_license_url' && typeof value === 'string') {
      value = value.slice(0, byKey[key].maxLength || 300);
    }
    if (key === 'footer_region_note' && typeof value === 'string') {
      value = value.slice(0, byKey[key].maxLength || 100);
    }
    await setConfigValue(key, value || '', byKey[key].label, byKey[key].tips || byKey[key].uploadRule || '');
  }
  const iconLogo = Object.prototype.hasOwnProperty.call(payload, 'icon_logo')
    ? String(payload.icon_logo || '').trim()
    : String(await getConfigValue('icon_logo') || '').trim();
  const logo = Object.prototype.hasOwnProperty.call(payload, 'brand_logo')
    ? String(payload.brand_logo || '').trim()
    : String(await getConfigValue('brand_logo') || '').trim();
  if (!iconLogo) {
    const err = new Error('请上传纯图片 Logo（浏览器标签缩略图）');
    err.name = 'ValidationError';
    throw err;
  }
  if (!logo) {
    const err = new Error('请上传文字 Logo（页面左上角）');
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
  let sort = Number(data.sort);
  if (!Number.isFinite(sort)) {
    const [maxRows] = await pool.query('SELECT COALESCE(MAX(sort), -1) AS max_sort FROM nuoyuan_footer_block');
    sort = Number(maxRows[0]?.max_sort ?? -1) + 1;
  }
  const [result] = await pool.query(
    `INSERT INTO nuoyuan_footer_block (title, layout_type, links_json, qrcode_image, copyright_text, sort, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      String(data.title || '').trim(),
      data.layout_type || 1,
      JSON.stringify(data.links || data.links_json || []),
      data.qrcode_image || null,
      (data.copyright_text || '').slice(0, 100) || null,
      sort,
      data.status === 0 ? 0 : 1,
    ]
  );
  const [rows] = await pool.query('SELECT * FROM nuoyuan_footer_block WHERE id = ?', [result.insertId]);
  const row = rows[0];
  if (!row) return null;
  return {
    ...row,
    links_json: row.links_json ? JSON.parse(row.links_json) : [],
  };
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
