/**
 * 初始化数据库种子数据
 * 运行: npm run seed
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

async function seedAdmin() {
  const hashed = await bcrypt.hash('123456', 10);
  const [rows] = await pool.query('SELECT id FROM nuoyuan_admin WHERE username = ?', ['admin']);
  if (rows.length > 0) {
    await pool.query('UPDATE nuoyuan_admin SET password = ? WHERE username = ?', [hashed, 'admin']);
    console.log('[Seed] 管理员 admin 密码已重置为: 123456');
    return;
  }

  await pool.query(
    'INSERT INTO nuoyuan_admin (username, password, real_name, role, status) VALUES (?, ?, ?, 1, 1)',
    ['admin', hashed, '超级管理员']
  );
  console.log('[Seed] 管理员账号创建成功: admin / 123456');
}

async function seedConfig() {
  const configs = [
    { config_key: 'site_public_open', config_value: '0', name: '网站对外开放', description: '0关闭 1开放；关闭时前台显示即将上线', sort: 0 },
    { config_key: 'site_name', config_value: '诺元智合', name: '网站名称', description: '网站名称', sort: 1 },
    { config_key: 'site_logo', config_value: '', name: '网站Logo', description: 'Logo图片URL', sort: 2 },
    { config_key: 'icon_logo', config_value: '/uploads/images/icon-logo-nuoyuan.png', name: '纯图片Logo', description: '浏览器标签缩略图', sort: 2 },
    { config_key: 'brand_logo', config_value: '/uploads/images/brand-logo-nuoyuan.png', name: '文字Logo', description: '页面左上角品牌图', sort: 2 },
    { config_key: 'inquiry_emails', config_value: '[]', name: '询价接收邮箱', description: '最多10个接收邮箱，JSON数组', sort: 6 },
    { config_key: 'icp_no', config_value: '', name: 'ICP备案号', description: '网站备案号', sort: 7 },
    { config_key: 'footer_copyright', config_value: '© 诺元智合 NUOYUAN BIOTECH. All rights reserved.', name: '底部版权文案', description: '最多200字符', sort: 8 },
    { config_key: 'footer_police_beian', config_value: '', name: '公安备案号', description: '页脚公安备案号', sort: 8 },
    { config_key: 'footer_license_text', config_value: '', name: '营业执照文案', description: '页脚营业执照文案', sort: 8 },
    { config_key: 'footer_license_url', config_value: '', name: '营业执照链接', description: '页脚营业执照链接', sort: 8 },
    { config_key: 'footer_region_note', config_value: '', name: '底栏补充说明', description: '页脚区域说明', sort: 8 },
    { config_key: 'seo_global_keywords', config_value: '', name: '全站SEO关键词', description: 'SEO关键词，多个可用逗号分隔', sort: 9 },
    { config_key: 'seo_global_description', config_value: '', name: '全站SEO描述', description: 'SEO描述', sort: 9 },
    { config_key: 'smtp_host', config_value: '', name: 'SMTP服务器', description: '发信服务器地址', sort: 20 },
    { config_key: 'smtp_port', config_value: '465', name: 'SMTP端口', description: '常见 465/587', sort: 21 },
    { config_key: 'smtp_user', config_value: '', name: 'SMTP账号', description: '发信邮箱账号', sort: 22 },
    { config_key: 'smtp_pass', config_value: '', name: 'SMTP密码/授权码', description: '邮箱密码或授权码', sort: 23 },
  ];

  for (const cfg of configs) {
    const [existing] = await pool.query('SELECT id FROM nuoyuan_config WHERE config_key = ?', [cfg.config_key]);
    if (existing.length === 0) {
      await pool.query(
        'INSERT INTO nuoyuan_config (config_key, config_value, name, description, sort) VALUES (?, ?, ?, ?, ?)',
        [cfg.config_key, cfg.config_value, cfg.name, cfg.description, cfg.sort]
      );
      console.log(`[Seed] 配置项 ${cfg.config_key} 已创建`);
    }
  }
}

async function seedNav() {
  const [rows] = await pool.query('SELECT id FROM nuoyuan_nav LIMIT 1');
  if (rows.length > 0) {
    console.log('[Seed] 导航数据已存在，跳过');
    return;
  }

  const navItems = [
    { name: '首页', en_name: 'Home', sort: 1, link_url: '/' },
    { name: '产品中心', en_name: 'Products', sort: 2, link_url: '/products' },
    { name: '技术服务', en_name: 'Services', sort: 3, link_url: '/services' },
    { name: '应用领域', en_name: 'Applications', sort: 4, link_url: '/applications' },
    { name: '新闻动态', en_name: 'News', sort: 5, link_url: '/news' },
    { name: '关于我们', en_name: 'About Us', sort: 6, link_url: '/about' },
    { name: '联系我们', en_name: 'Contact', sort: 7, link_url: '/contact' },
  ];

  for (const item of navItems) {
    await pool.query(
      'INSERT INTO nuoyuan_nav (parent_id, name, en_name, link_url, sort, status) VALUES (0, ?, ?, ?, ?, 1)',
      [item.name, item.en_name, item.link_url, item.sort]
    );
  }
  console.log('[Seed] 默认导航菜单已创建');
}

async function seedDefaultPages() {
  const defaults = [
    { title: '首页', nav_name: 'home', tab_sort: 1 },
    { title: '产品中心', nav_name: 'products', tab_sort: 2 },
    { title: '技术服务', nav_name: 'services', tab_sort: 3 },
    { title: '新闻动态', nav_name: 'news', tab_sort: 4 },
    { title: '关于我们', nav_name: 'about', tab_sort: 5 },
    { title: '联系我们', nav_name: 'contact', tab_sort: 6 },
  ];
  for (const row of defaults) {
    const [exists] = await pool.query('SELECT id FROM nuoyuan_page WHERE nav_name = ? LIMIT 1', [row.nav_name]);
    if (!exists.length) {
      await pool.query(
        'INSERT INTO nuoyuan_page (title, nav_name, content, tab_sort, status) VALUES (?, ?, ?, ?, 1)',
        [row.title, row.nav_name, '', row.tab_sort]
      );
      console.log(`[Seed] 默认页面已创建: ${row.title}`);
    }
  }
}

async function seedDefaultPageModules() {
  const templateRows = [
    { page_key: 'home', module_name: '首页宽幅图', module_template: 'full_width_single_image', sort: 1, image_list_json: JSON.stringify([{ name: 'banner', url: '/uploads/images/demo-home-banner.jpg' }]) },
    { page_key: 'home', module_name: '首页图文介绍', module_template: 'image_text_split', sort: 2, main_title: '核心服务能力', body_text: '可在后台修改这段介绍文字，支持图文布局。', layout_mode: 'left', image_list_json: JSON.stringify([{ name: 'intro', url: '/uploads/images/demo-home-intro.jpg' }]) },
    { page_key: 'products', module_name: '产品页轮播', module_template: 'multi_image_carousel', sort: 1, image_list_json: JSON.stringify([{ name: 'p1', url: '/uploads/images/demo-products-1.jpg' }]) },
    { page_key: 'services', module_name: '技术服务视频', module_template: 'single_video_module', sort: 1, main_title: '技术服务介绍', body_text: '上传视频后前台自动渲染。', video_url: '/uploads/videos/demo-services.mp4' },
    { page_key: 'news', module_name: '新闻跳转卡片', module_template: 'image_jump_button', sort: 1, jump_type: 'page', link_url: '/news', main_title: '新闻动态', body_text: '了解最新行业资讯与公司动态', image_list_json: JSON.stringify([]), extra: { button_text: '查看更多新闻' } },
  ];
  for (const row of templateRows) {
    const [exists] = await pool.query(
      'SELECT id FROM nuoyuan_page_module WHERE page_key = ? AND module_name = ? LIMIT 1',
      [row.page_key, row.module_name]
    );
    if (exists.length) continue;
    const autoData = {
      main_title: row.main_title || '',
      body_text: row.body_text || '',
      layout_mode: row.layout_mode || '',
      images: row.image_list_json ? JSON.parse(row.image_list_json) : [],
      video_url: row.video_url || '',
      link_url: row.link_url || '',
      jump_type: row.jump_type || '',
      jump_product_code: row.jump_product_code || '',
      extra: row.extra || {},
    };
    await pool.query(
      `INSERT INTO nuoyuan_page_module
       (page_key, module_no, module_name, module_template, main_title, body_text, layout_mode, image_list_json, video_url, link_url, jump_type, jump_product_code, extra_json, module_data, sort, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        row.page_key,
        row.sort,
        row.module_name,
        row.module_template,
        row.main_title || null,
        row.body_text || null,
        row.layout_mode || null,
        row.image_list_json || JSON.stringify([]),
        row.video_url || null,
        row.link_url || null,
        row.jump_type || null,
        row.jump_product_code || null,
        JSON.stringify(row.extra || {}),
        JSON.stringify(autoData),
        row.sort,
      ]
    );
    console.log(`[Seed] 默认模块已创建: ${row.page_key} - ${row.module_name}`);
  }
}

async function seedProductCategories() {
  async function ensureCategory({ parent_id = 0, name, en_name = '', description = '', sort = 0, status = 1 }) {
    const [exists] = await pool.query(
      'SELECT id FROM nuoyuan_product_category WHERE parent_id = ? AND name = ? LIMIT 1',
      [parent_id, name]
    );
    if (exists.length) return exists[0].id;
    const [result] = await pool.query(
      'INSERT INTO nuoyuan_product_category (parent_id, name, en_name, description, sort, status) VALUES (?, ?, ?, ?, ?, ?)',
      [parent_id, name, en_name || null, description || null, sort, status]
    );
    return result.insertId;
  }

  const [catRows] = await pool.query('SELECT id, name FROM nuoyuan_product_category ORDER BY sort ASC');
  let geneEditingId;
  let reagentId;

  if (catRows.length === 0) {
    const [cat1] = await pool.query(
      'INSERT INTO nuoyuan_product_category (parent_id, name, en_name, description, sort, status) VALUES (0, ?, ?, ?, 1, 1)',
      ['基因编辑核心服务', 'Gene Editing Core Services', '核心主打业务']
    );
    const [cat2] = await pool.query(
      'INSERT INTO nuoyuan_product_category (parent_id, name, en_name, description, sort, status) VALUES (0, ?, ?, ?, 2, 1)',
      ['科研实验试剂产品', 'Research Reagents', '主营销售业务']
    );
    geneEditingId = cat1.insertId;
    reagentId = cat2.insertId;
    console.log('[Seed] 产品分类已创建');
  } else {
    geneEditingId = catRows.find((c) => c.name.includes('基因编辑'))?.id || catRows[0].id;
    reagentId = catRows.find((c) => c.name.includes('试剂'))?.id || catRows[1]?.id || catRows[0].id;
    console.log('[Seed] 产品分类已存在，跳过创建');
  }

  // 多级分类模板（对标竞品下拉结构，运营可继续编辑）
  await ensureCategory({ parent_id: geneEditingId, name: '长链RNA合成', en_name: 'Long RNA Synthesis', description: 'sgRNA/crRNA/tracrRNA' , sort: 11 });
  await ensureCategory({ parent_id: geneEditingId, name: 'CRISPR/Cas9技术服务', en_name: 'CRISPR/Cas9 Services', description: '敲除/敲入/点突变', sort: 12 });
  await ensureCategory({ parent_id: geneEditingId, name: '基因与载体构建', en_name: 'Gene & Vector Construction', description: '载体改造/克隆测序', sort: 13 });
  await ensureCategory({ parent_id: geneEditingId, name: '蛋白表达与纯化服务', en_name: 'Protein Expression Services', description: '重组蛋白表达纯化', sort: 14 });
  await ensureCategory({ parent_id: geneEditingId, name: '细胞分选与激活', en_name: 'Cell Sorting & Activation', description: '细胞筛选与活化', sort: 15 });

  await ensureCategory({ parent_id: reagentId, name: '分子生物学试剂', en_name: 'Molecular Biology Reagents', description: 'PCR/qPCR/核酸提取', sort: 21 });
  await ensureCategory({ parent_id: reagentId, name: '细胞培养试剂', en_name: 'Cell Culture Reagents', description: '血清/培养基/冻存液', sort: 22 });
  await ensureCategory({ parent_id: reagentId, name: '蛋白与多肽试剂', en_name: 'Protein & Peptide Reagents', description: '抗体/重组蛋白/多肽', sort: 23 });
  await ensureCategory({ parent_id: reagentId, name: 'ELISA试剂盒', en_name: 'ELISA Kits', description: '免疫检测配套试剂', sort: 24 });
  await ensureCategory({ parent_id: reagentId, name: '实验室仪器耗材', en_name: 'Lab Instruments', description: '移液器/离心耗材/过滤器材', sort: 25 });

  const [prodRows] = await pool.query('SELECT id FROM nuoyuan_product LIMIT 1');
  if (prodRows.length > 0) {
    console.log('[Seed] 产品数据已存在，跳过');
    return;
  }

  const products = [
    {
      category_id: geneEditingId,
      name: '长链RNA合成服务',
      en_name: 'Long-chain RNA Synthesis',
      short_desc: '可实现长达266nt超长链RNA合成，覆盖sgRNA、crRNA、tracrRNA、修饰RNA等多种品类，适配CRISPR-Cas9、碱基编辑、先导编辑等多元化基因编辑体系。',
      core_advantage: '超长片段合成、多重修饰可选、编辑效率高、质控严格、交付周期短',
      sort: 1,
      is_hot: 1,
    },
    {
      category_id: geneEditingId,
      name: 'CRISPR/Cas9全套技术服务',
      en_name: 'CRISPR/Cas9 Full Technical Service',
      short_desc: '提供化学合成sgRNA、单链/双链模板、环状敲入模板、Cas9蛋白与mRNA供应、细胞基因定点编辑等一站式服务。',
      core_advantage: '编辑效率高、脱靶可控、实验重复性强、全程技术跟进',
      sort: 2,
      is_hot: 1,
    },
    {
      category_id: geneEditingId,
      name: '基因与载体构建服务',
      en_name: 'Gene & Vector Construction',
      short_desc: '提供任意难度基因合成、质粒载体构建、密码子优化、载体改造、克隆测序验证服务，支持复杂序列、高GC含量、特殊结构基因合成。',
      core_advantage: '序列零误差、成功率高、交付快、可定制复杂载体',
      sort: 3,
      is_hot: 1,
    },
    {
      category_id: reagentId,
      name: '分子生物学试剂',
      en_name: 'Molecular Biology Reagents',
      short_desc: '涵盖PCR试剂、qPCR预混液、反转录试剂盒、限制性内切酶、DNA连接酶、核酸染料、DNA/RNA提取试剂盒等全系分子实验原料。',
      core_advantage: '品质稳定、适配性广、满足常规分子克隆与核酸检测实验需求',
      sort: 1,
      is_hot: 0,
    },
    {
      category_id: reagentId,
      name: '细胞培养试剂',
      en_name: 'Cell Culture Reagents',
      short_desc: '提供高品质胎牛血清、基础培养基、完全培养基、胰酶消化液、双抗、细胞冻存液等产品，无菌级别高、批次差异小。',
      core_advantage: '保障细胞正常增殖与稳定传代',
      sort: 2,
      is_hot: 0,
    },
    {
      category_id: reagentId,
      name: '蛋白与多肽科研试剂',
      en_name: 'Protein & Peptide Reagents',
      short_desc: '覆盖多肽合成、重组蛋白、抗体科研试剂、蛋白纯化填料等产品，纯度可控、活性稳定。',
      core_advantage: '适配蛋白表达、纯化、WB检测、抗原抗体验证等实验场景',
      sort: 3,
      is_hot: 0,
    },
  ];

  for (const p of products) {
    await pool.query(
      `INSERT INTO nuoyuan_product (category_id, name, en_name, short_desc, core_advantage, sort, is_hot, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
      [p.category_id, p.name, p.en_name, p.short_desc, p.core_advantage, p.sort, p.is_hot]
    );
  }
  console.log('[Seed] 产品分类及产品数据已创建');
}

async function seedNewsCategory() {
  const [rows] = await pool.query('SELECT id FROM nuoyuan_news_category LIMIT 1');
  if (rows.length > 0) {
    console.log('[Seed] 新闻分类已存在，跳过');
    return;
  }
  await pool.query(
    'INSERT INTO nuoyuan_news_category (name, sort, status) VALUES (?, 1, 1), (?, 2, 1), (?, 3, 1)',
    ['公司新闻', '行业动态', '技术资讯']
  );
  console.log('[Seed] 新闻分类已创建');
}

async function seedProductFilterTags() {
  try {
    const defaults = [
      { tag_group: 'product_type', tag_name: '基因编辑服务', sort: 1 },
      { tag_group: 'product_type', tag_name: '分子生物学试剂', sort: 2 },
      { tag_group: 'product_type', tag_name: '细胞培养试剂', sort: 3 },
      { tag_group: 'product_type', tag_name: '蛋白与多肽试剂', sort: 4 },
      { tag_group: 'app_type', tag_name: '基因编辑研究', sort: 1 },
      { tag_group: 'app_type', tag_name: '核酸实验', sort: 2 },
      { tag_group: 'app_type', tag_name: '细胞培养', sort: 3 },
      { tag_group: 'app_type', tag_name: '蛋白研究', sort: 4 },
      { tag_group: 'level_tag', tag_name: '常规科研级', sort: 1 },
      { tag_group: 'level_tag', tag_name: '转化研究级', sort: 2 },
    ];
    for (const row of defaults) {
      const [exists] = await pool.query(
        'SELECT id FROM nuoyuan_product_filter_tag WHERE tag_group = ? AND tag_name = ? LIMIT 1',
        [row.tag_group, row.tag_name]
      );
      if (!exists.length) {
        await pool.query(
          'INSERT INTO nuoyuan_product_filter_tag (tag_group, tag_name, sort, status) VALUES (?, ?, ?, 1)',
          [row.tag_group, row.tag_name, row.sort]
        );
      }
    }
    await pool.query(
      `UPDATE nuoyuan_product
       SET product_type = '基因编辑服务', app_type = '基因编辑研究', level_tag = '转化研究级'
       WHERE (product_type IS NULL OR product_type = '')
         AND (name LIKE '%RNA%' OR name LIKE '%CRISPR%' OR name LIKE '%载体%' OR name LIKE '%基因%')`
    );
    await pool.query(
      `UPDATE nuoyuan_product
       SET product_type = '分子生物学试剂', app_type = '核酸实验', level_tag = '常规科研级'
       WHERE (product_type IS NULL OR product_type = '')
         AND (name LIKE '%分子生物%' OR name LIKE '%PCR%' OR name LIKE '%核酸%')`
    );
    await pool.query(
      `UPDATE nuoyuan_product
       SET product_type = '细胞培养试剂', app_type = '细胞培养', level_tag = '常规科研级'
       WHERE (product_type IS NULL OR product_type = '')
         AND (name LIKE '%细胞培养%' OR name LIKE '%血清%' OR name LIKE '%培养基%')`
    );
    await pool.query(
      `UPDATE nuoyuan_product
       SET product_type = '蛋白与多肽试剂', app_type = '蛋白研究', level_tag = '常规科研级'
       WHERE (product_type IS NULL OR product_type = '')
         AND (name LIKE '%蛋白%' OR name LIKE '%多肽%' OR name LIKE '%抗体%')`
    );
    await pool.query(
      `UPDATE nuoyuan_product
       SET product_type = COALESCE(NULLIF(product_type, ''), '分子生物学试剂'),
           app_type = COALESCE(NULLIF(app_type, ''), '核酸实验'),
           level_tag = COALESCE(NULLIF(level_tag, ''), '常规科研级')`
    );
    console.log('[Seed] 产品筛选标签已初始化');
  } catch (err) {
    console.log('[Seed] 未检测到产品筛选标签表，请先执行升级SQL：backend/sql/upgrade_v7.sql');
  }
}

async function main() {
  try {
    console.log('[Seed] 开始初始化数据...');
    await seedAdmin();
    await seedConfig();
    await seedNav();
    await seedDefaultPages();
    await seedDefaultPageModules();
    await seedProductCategories();
    await seedProductFilterTags();
    await seedNewsCategory();
    console.log('[Seed] 初始化完成');
    process.exit(0);
  } catch (err) {
    console.error('[Seed] 初始化失败:', err);
    process.exit(1);
  }
}

main();
