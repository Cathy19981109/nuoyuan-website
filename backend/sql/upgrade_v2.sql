-- 诺元智合官网 v2 升级脚本
-- 执行前请先备份数据库
USE `nuoyuan_website`;

-- 1) 产品5位数字编码
ALTER TABLE `nuoyuan_product`
  ADD COLUMN `product_code` char(5) DEFAULT NULL COMMENT '产品5位数字编码' AFTER `id`;

UPDATE `nuoyuan_product`
SET `product_code` = LPAD(`id`, 5, '0')
WHERE `product_code` IS NULL OR `product_code` = '';

ALTER TABLE `nuoyuan_product`
  ADD UNIQUE KEY `uk_product_code` (`product_code`);

-- 2) 导航下拉扩展字段（下拉横幅图）
ALTER TABLE `nuoyuan_nav`
  ADD COLUMN `dropdown_banner` varchar(255) DEFAULT NULL COMMENT '导航下拉横幅图' AFTER `target`;

-- 3) 询价记录扩展（自定义表单）
ALTER TABLE `nuoyuan_inquiry`
  ADD COLUMN `custom_form_data` longtext DEFAULT NULL COMMENT '自定义表单JSON' AFTER `demand`;

-- 4) 页面模块表（支持模板化）
CREATE TABLE IF NOT EXISTS `nuoyuan_page_module` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '模块ID',
  `page_key` varchar(50) NOT NULL COMMENT '页面标识：home/products/services/applications/news/about/contact',
  `module_no` int NOT NULL COMMENT '页面内唯一序号',
  `module_name` varchar(100) NOT NULL COMMENT '模块名称（运营可读）',
  `module_template` varchar(100) NOT NULL COMMENT '模板类型',
  `front_position` varchar(100) DEFAULT NULL COMMENT '前台展示位置说明',
  `module_data` longtext DEFAULT NULL COMMENT '模块配置JSON',
  `sort` int NOT NULL DEFAULT '0' COMMENT '排序值',
  `status` tinyint(1) NOT NULL DEFAULT '1' COMMENT '1=显示 0=隐藏',
  `created_admin_id` int unsigned DEFAULT NULL COMMENT '创建人',
  `updated_admin_id` int unsigned DEFAULT NULL COMMENT '更新人',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_page_module_no` (`page_key`,`module_no`),
  KEY `idx_page_key` (`page_key`),
  KEY `idx_sort` (`sort`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='页面模块表';

-- 5) 模块回收站（30天保留）
CREATE TABLE IF NOT EXISTS `nuoyuan_module_recycle` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '回收站记录ID',
  `module_id` bigint unsigned NOT NULL COMMENT '原模块ID',
  `page_key` varchar(50) NOT NULL COMMENT '页面标识',
  `module_no` int NOT NULL COMMENT '模块序号',
  `module_name` varchar(100) NOT NULL COMMENT '模块名称',
  `module_template` varchar(100) NOT NULL COMMENT '模板类型',
  `front_position` varchar(100) DEFAULT NULL COMMENT '前台展示位置',
  `module_data` longtext DEFAULT NULL COMMENT '模块配置JSON',
  `deleted_admin_id` int unsigned DEFAULT NULL COMMENT '删除人',
  `deleted_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '删除时间',
  `expire_at` datetime NOT NULL COMMENT '到期清理时间',
  PRIMARY KEY (`id`),
  KEY `idx_page_module_no` (`page_key`,`module_no`),
  KEY `idx_expire_at` (`expire_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='页面模块回收站';

-- 6) 页脚模块
CREATE TABLE IF NOT EXISTS `nuoyuan_footer_block` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '页脚模块ID',
  `title` varchar(100) NOT NULL COMMENT '栏目标题',
  `layout_type` tinyint NOT NULL DEFAULT '1' COMMENT '布局栏数：1/2/3/4',
  `links_json` longtext DEFAULT NULL COMMENT '链接与文案JSON',
  `qrcode_image` varchar(255) DEFAULT NULL COMMENT '二维码图片',
  `copyright_text` varchar(100) DEFAULT NULL COMMENT '版权文案',
  `sort` int NOT NULL DEFAULT '0',
  `status` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='页脚模块';

-- 7) 询价表单模板（拖拽组件配置）
CREATE TABLE IF NOT EXISTS `nuoyuan_inquiry_form_template` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '模板ID',
  `name` varchar(100) NOT NULL COMMENT '模板名称',
  `is_default` tinyint(1) NOT NULL DEFAULT '1' COMMENT '默认模板',
  `schema_json` longtext NOT NULL COMMENT '表单结构JSON',
  `status` tinyint(1) NOT NULL DEFAULT '1' COMMENT '1启用',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='询价表单模板';

-- 8) 流量统计（日维度）
CREATE TABLE IF NOT EXISTS `nuoyuan_traffic_daily` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `stat_date` date NOT NULL COMMENT '统计日期',
  `visit_count` int NOT NULL DEFAULT '0' COMMENT '访问次数',
  `visitor_count` int NOT NULL DEFAULT '0' COMMENT '访客数',
  `source_json` longtext DEFAULT NULL COMMENT '来源分布JSON',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_stat_date` (`stat_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='网站流量统计';

-- 9) 产品统计（日维度）
CREATE TABLE IF NOT EXISTS `nuoyuan_product_daily_stats` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `stat_date` date NOT NULL COMMENT '统计日期',
  `product_id` int unsigned NOT NULL COMMENT '产品ID',
  `view_count` int NOT NULL DEFAULT '0' COMMENT '浏览量',
  `inquiry_count` int NOT NULL DEFAULT '0' COMMENT '询价量',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_date_product` (`stat_date`,`product_id`),
  KEY `idx_product` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='产品日统计';

-- 10) 官网中心默认配置补充
INSERT IGNORE INTO `nuoyuan_config` (`config_key`,`config_value`,`name`,`description`,`sort`) VALUES
('brand_title','诺元智合','品牌标题','顶部Logo旁品牌文字，最多8个中文字符',1),
('brand_logo','', '品牌Logo', '顶部品牌Logo图片URL', 2),
('icp_no','', 'ICP备案号', '网站备案信息', 20),
('seo_global_keywords','', '全站SEO关键词', '用于搜索优化', 21),
('seo_global_description','', '全站SEO描述', '用于搜索优化描述', 22),
('upload_limit_notice','图片默认限制：png/jpg/webp；具体尺寸见各模块提示','上传规范说明','后台统一展示的上传规范',23),
('footer_copyright','© 诺元智合 NUOYUAN BIOTECH. All rights reserved.','底部版权文案','全站底部版权文字，最多100字符',24);

-- 11) 询价表单默认模板
INSERT INTO `nuoyuan_inquiry_form_template` (`name`, `is_default`, `schema_json`, `status`)
SELECT '默认询价表单', 1,
'[
  {"id":"f_name","label":"联系人","type":"text","required":true,"placeholder":"请输入联系人姓名","maxLength":30},
  {"id":"f_phone","label":"联系电话","type":"phone","required":true,"placeholder":"请输入联系电话","maxLength":20},
  {"id":"f_email","label":"联系邮箱","type":"email","required":false,"placeholder":"请输入邮箱","maxLength":100},
  {"id":"f_company","label":"单位名称","type":"text","required":false,"placeholder":"请输入公司/单位名称","maxLength":120},
  {"id":"f_product","label":"咨询产品","type":"text","required":false,"placeholder":"请输入咨询产品","maxLength":200},
  {"id":"f_spec","label":"样品规格","type":"text","required":false,"placeholder":"请输入样品规格","maxLength":120},
  {"id":"f_demand","label":"实验需求","type":"textarea","required":true,"placeholder":"请填写详细需求","maxLength":2000}
]',
1
WHERE NOT EXISTS (SELECT 1 FROM `nuoyuan_inquiry_form_template`);
