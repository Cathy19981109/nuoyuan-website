-- V7：服务独立数据 + 产品多维筛选标签

-- 1) 产品新增三组筛选标签字段
ALTER TABLE `nuoyuan_product`
  ADD COLUMN IF NOT EXISTS `product_type` text DEFAULT NULL COMMENT '产品类型多标签，英文逗号分隔' AFTER `goods_code`,
  ADD COLUMN IF NOT EXISTS `app_type` text DEFAULT NULL COMMENT '应用分类多标签，英文逗号分隔' AFTER `product_type`,
  ADD COLUMN IF NOT EXISTS `level_tag` text DEFAULT NULL COMMENT '级别多标签，英文逗号分隔' AFTER `app_type`;

-- 2) 产品筛选标签管理表（后台可视化维护）
CREATE TABLE IF NOT EXISTS `nuoyuan_product_filter_tag` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tag_group` varchar(30) NOT NULL COMMENT 'product_type/app_type/level_tag',
  `tag_name` varchar(120) NOT NULL COMMENT '标签名称',
  `sort` int NOT NULL DEFAULT 0 COMMENT '排序',
  `status` tinyint(1) NOT NULL DEFAULT 1 COMMENT '1启用 0停用',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_group_name` (`tag_group`, `tag_name`),
  KEY `idx_group_sort` (`tag_group`, `sort`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2.1) 默认标签（贴合现有产品，防重复）
INSERT INTO `nuoyuan_product_filter_tag` (`tag_group`, `tag_name`, `sort`, `status`)
SELECT 'product_type', '基因编辑服务', 1, 1
WHERE NOT EXISTS (
  SELECT 1 FROM `nuoyuan_product_filter_tag` WHERE `tag_group` = 'product_type' AND `tag_name` = '基因编辑服务'
);
INSERT INTO `nuoyuan_product_filter_tag` (`tag_group`, `tag_name`, `sort`, `status`)
SELECT 'product_type', '分子生物学试剂', 2, 1
WHERE NOT EXISTS (
  SELECT 1 FROM `nuoyuan_product_filter_tag` WHERE `tag_group` = 'product_type' AND `tag_name` = '分子生物学试剂'
);
INSERT INTO `nuoyuan_product_filter_tag` (`tag_group`, `tag_name`, `sort`, `status`)
SELECT 'product_type', '细胞培养试剂', 3, 1
WHERE NOT EXISTS (
  SELECT 1 FROM `nuoyuan_product_filter_tag` WHERE `tag_group` = 'product_type' AND `tag_name` = '细胞培养试剂'
);
INSERT INTO `nuoyuan_product_filter_tag` (`tag_group`, `tag_name`, `sort`, `status`)
SELECT 'product_type', '蛋白与多肽试剂', 4, 1
WHERE NOT EXISTS (
  SELECT 1 FROM `nuoyuan_product_filter_tag` WHERE `tag_group` = 'product_type' AND `tag_name` = '蛋白与多肽试剂'
);
INSERT INTO `nuoyuan_product_filter_tag` (`tag_group`, `tag_name`, `sort`, `status`)
SELECT 'app_type', '基因编辑研究', 1, 1
WHERE NOT EXISTS (
  SELECT 1 FROM `nuoyuan_product_filter_tag` WHERE `tag_group` = 'app_type' AND `tag_name` = '基因编辑研究'
);
INSERT INTO `nuoyuan_product_filter_tag` (`tag_group`, `tag_name`, `sort`, `status`)
SELECT 'app_type', '核酸实验', 2, 1
WHERE NOT EXISTS (
  SELECT 1 FROM `nuoyuan_product_filter_tag` WHERE `tag_group` = 'app_type' AND `tag_name` = '核酸实验'
);
INSERT INTO `nuoyuan_product_filter_tag` (`tag_group`, `tag_name`, `sort`, `status`)
SELECT 'app_type', '细胞培养', 3, 1
WHERE NOT EXISTS (
  SELECT 1 FROM `nuoyuan_product_filter_tag` WHERE `tag_group` = 'app_type' AND `tag_name` = '细胞培养'
);
INSERT INTO `nuoyuan_product_filter_tag` (`tag_group`, `tag_name`, `sort`, `status`)
SELECT 'app_type', '蛋白研究', 4, 1
WHERE NOT EXISTS (
  SELECT 1 FROM `nuoyuan_product_filter_tag` WHERE `tag_group` = 'app_type' AND `tag_name` = '蛋白研究'
);
INSERT INTO `nuoyuan_product_filter_tag` (`tag_group`, `tag_name`, `sort`, `status`)
SELECT 'level_tag', '常规科研级', 1, 1
WHERE NOT EXISTS (
  SELECT 1 FROM `nuoyuan_product_filter_tag` WHERE `tag_group` = 'level_tag' AND `tag_name` = '常规科研级'
);
INSERT INTO `nuoyuan_product_filter_tag` (`tag_group`, `tag_name`, `sort`, `status`)
SELECT 'level_tag', '转化研究级', 2, 1
WHERE NOT EXISTS (
  SELECT 1 FROM `nuoyuan_product_filter_tag` WHERE `tag_group` = 'level_tag' AND `tag_name` = '转化研究级'
);

-- 2.2) 将现有产品自动放入上述标签（仅在未设置时回填）
UPDATE `nuoyuan_product`
SET
  `product_type` = '基因编辑服务',
  `app_type` = '基因编辑研究',
  `level_tag` = '转化研究级'
WHERE (`product_type` IS NULL OR `product_type` = '')
  AND (`name` LIKE '%RNA%' OR `name` LIKE '%CRISPR%' OR `name` LIKE '%载体%' OR `name` LIKE '%基因%');

UPDATE `nuoyuan_product`
SET
  `product_type` = '分子生物学试剂',
  `app_type` = '核酸实验',
  `level_tag` = '常规科研级'
WHERE (`product_type` IS NULL OR `product_type` = '')
  AND (`name` LIKE '%分子生物%' OR `name` LIKE '%PCR%' OR `name` LIKE '%核酸%');

UPDATE `nuoyuan_product`
SET
  `product_type` = '细胞培养试剂',
  `app_type` = '细胞培养',
  `level_tag` = '常规科研级'
WHERE (`product_type` IS NULL OR `product_type` = '')
  AND (`name` LIKE '%细胞培养%' OR `name` LIKE '%血清%' OR `name` LIKE '%培养基%');

UPDATE `nuoyuan_product`
SET
  `product_type` = '蛋白与多肽试剂',
  `app_type` = '蛋白研究',
  `level_tag` = '常规科研级'
WHERE (`product_type` IS NULL OR `product_type` = '')
  AND (`name` LIKE '%蛋白%' OR `name` LIKE '%多肽%' OR `name` LIKE '%抗体%');

UPDATE `nuoyuan_product`
SET
  `product_type` = COALESCE(NULLIF(`product_type`, ''), '分子生物学试剂'),
  `app_type` = COALESCE(NULLIF(`app_type`, ''), '核酸实验'),
  `level_tag` = COALESCE(NULLIF(`level_tag`, ''), '常规科研级')
WHERE 1 = 1;

-- 2.3) 预置多级产品分类（可重复执行，已存在则跳过）
INSERT INTO `nuoyuan_product_category` (`parent_id`, `name`, `en_name`, `description`, `sort`, `status`)
SELECT p.id, '长链RNA合成', 'Long RNA Synthesis', 'sgRNA/crRNA/tracrRNA', 11, 1
FROM `nuoyuan_product_category` p
WHERE p.`parent_id` = 0 AND p.`name` = '基因编辑核心服务'
  AND NOT EXISTS (
    SELECT 1 FROM `nuoyuan_product_category` c WHERE c.`parent_id` = p.id AND c.`name` = '长链RNA合成'
  );
INSERT INTO `nuoyuan_product_category` (`parent_id`, `name`, `en_name`, `description`, `sort`, `status`)
SELECT p.id, 'CRISPR/Cas9技术服务', 'CRISPR/Cas9 Services', '敲除/敲入/点突变', 12, 1
FROM `nuoyuan_product_category` p
WHERE p.`parent_id` = 0 AND p.`name` = '基因编辑核心服务'
  AND NOT EXISTS (
    SELECT 1 FROM `nuoyuan_product_category` c WHERE c.`parent_id` = p.id AND c.`name` = 'CRISPR/Cas9技术服务'
  );
INSERT INTO `nuoyuan_product_category` (`parent_id`, `name`, `en_name`, `description`, `sort`, `status`)
SELECT p.id, '基因与载体构建', 'Gene & Vector Construction', '载体改造/克隆测序', 13, 1
FROM `nuoyuan_product_category` p
WHERE p.`parent_id` = 0 AND p.`name` = '基因编辑核心服务'
  AND NOT EXISTS (
    SELECT 1 FROM `nuoyuan_product_category` c WHERE c.`parent_id` = p.id AND c.`name` = '基因与载体构建'
  );
INSERT INTO `nuoyuan_product_category` (`parent_id`, `name`, `en_name`, `description`, `sort`, `status`)
SELECT p.id, '蛋白表达与纯化服务', 'Protein Expression Services', '重组蛋白表达纯化', 14, 1
FROM `nuoyuan_product_category` p
WHERE p.`parent_id` = 0 AND p.`name` = '基因编辑核心服务'
  AND NOT EXISTS (
    SELECT 1 FROM `nuoyuan_product_category` c WHERE c.`parent_id` = p.id AND c.`name` = '蛋白表达与纯化服务'
  );
INSERT INTO `nuoyuan_product_category` (`parent_id`, `name`, `en_name`, `description`, `sort`, `status`)
SELECT p.id, '细胞分选与激活', 'Cell Sorting & Activation', '细胞筛选与活化', 15, 1
FROM `nuoyuan_product_category` p
WHERE p.`parent_id` = 0 AND p.`name` = '基因编辑核心服务'
  AND NOT EXISTS (
    SELECT 1 FROM `nuoyuan_product_category` c WHERE c.`parent_id` = p.id AND c.`name` = '细胞分选与激活'
  );

INSERT INTO `nuoyuan_product_category` (`parent_id`, `name`, `en_name`, `description`, `sort`, `status`)
SELECT p.id, '分子生物学试剂', 'Molecular Biology Reagents', 'PCR/qPCR/核酸提取', 21, 1
FROM `nuoyuan_product_category` p
WHERE p.`parent_id` = 0 AND p.`name` = '科研实验试剂产品'
  AND NOT EXISTS (
    SELECT 1 FROM `nuoyuan_product_category` c WHERE c.`parent_id` = p.id AND c.`name` = '分子生物学试剂'
  );
INSERT INTO `nuoyuan_product_category` (`parent_id`, `name`, `en_name`, `description`, `sort`, `status`)
SELECT p.id, '细胞培养试剂', 'Cell Culture Reagents', '血清/培养基/冻存液', 22, 1
FROM `nuoyuan_product_category` p
WHERE p.`parent_id` = 0 AND p.`name` = '科研实验试剂产品'
  AND NOT EXISTS (
    SELECT 1 FROM `nuoyuan_product_category` c WHERE c.`parent_id` = p.id AND c.`name` = '细胞培养试剂'
  );
INSERT INTO `nuoyuan_product_category` (`parent_id`, `name`, `en_name`, `description`, `sort`, `status`)
SELECT p.id, '蛋白与多肽试剂', 'Protein & Peptide Reagents', '抗体/重组蛋白/多肽', 23, 1
FROM `nuoyuan_product_category` p
WHERE p.`parent_id` = 0 AND p.`name` = '科研实验试剂产品'
  AND NOT EXISTS (
    SELECT 1 FROM `nuoyuan_product_category` c WHERE c.`parent_id` = p.id AND c.`name` = '蛋白与多肽试剂'
  );
INSERT INTO `nuoyuan_product_category` (`parent_id`, `name`, `en_name`, `description`, `sort`, `status`)
SELECT p.id, 'ELISA试剂盒', 'ELISA Kits', '免疫检测配套试剂', 24, 1
FROM `nuoyuan_product_category` p
WHERE p.`parent_id` = 0 AND p.`name` = '科研实验试剂产品'
  AND NOT EXISTS (
    SELECT 1 FROM `nuoyuan_product_category` c WHERE c.`parent_id` = p.id AND c.`name` = 'ELISA试剂盒'
  );
INSERT INTO `nuoyuan_product_category` (`parent_id`, `name`, `en_name`, `description`, `sort`, `status`)
SELECT p.id, '实验室仪器耗材', 'Lab Instruments', '移液器/离心耗材/过滤器材', 25, 1
FROM `nuoyuan_product_category` p
WHERE p.`parent_id` = 0 AND p.`name` = '科研实验试剂产品'
  AND NOT EXISTS (
    SELECT 1 FROM `nuoyuan_product_category` c WHERE c.`parent_id` = p.id AND c.`name` = '实验室仪器耗材'
  );

-- 3) 服务独立分类表
CREATE TABLE IF NOT EXISTS `nuoyuan_service_category` (
  `id` int NOT NULL AUTO_INCREMENT,
  `parent_id` int NOT NULL DEFAULT 0,
  `name` varchar(100) NOT NULL,
  `en_name` varchar(100) DEFAULT NULL,
  `description` varchar(500) DEFAULT NULL,
  `icon` varchar(255) DEFAULT NULL,
  `sort` int NOT NULL DEFAULT 0,
  `status` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4) 服务独立数据表（结构与产品表对齐，便于前台复用）
CREATE TABLE IF NOT EXISTS `nuoyuan_service` (
  `id` int NOT NULL AUTO_INCREMENT,
  `service_code` varchar(20) DEFAULT NULL COMMENT '服务5位编号',
  `goods_code` varchar(50) DEFAULT NULL COMMENT '货号/目录号',
  `category_id` int NOT NULL,
  `name` varchar(200) NOT NULL,
  `en_name` varchar(200) DEFAULT NULL,
  `short_desc` varchar(1000) DEFAULT NULL,
  `spec_text` varchar(500) DEFAULT NULL,
  `core_advantage` text,
  `content` longtext,
  `detail_richtext` longtext,
  `cover_image` varchar(500) DEFAULT NULL,
  `banner_image` varchar(500) DEFAULT NULL,
  `gallery_json` longtext,
  `sort` int NOT NULL DEFAULT 0,
  `is_hot` tinyint(1) NOT NULL DEFAULT 0,
  `status` tinyint(1) NOT NULL DEFAULT 1,
  `view_count` int NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_service_code` (`service_code`),
  KEY `idx_service_goods_code` (`goods_code`),
  KEY `idx_service_category` (`category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5) 数据迁移：将“基因编辑”类目及其产品迁移到服务表（避免影响原产品数据）
INSERT INTO `nuoyuan_service_category` (`id`, `parent_id`, `name`, `en_name`, `description`, `icon`, `sort`, `status`, `created_at`, `updated_at`)
SELECT pc.`id`, pc.`parent_id`, pc.`name`, pc.`en_name`, pc.`description`, pc.`icon`, pc.`sort`, pc.`status`, pc.`created_at`, pc.`updated_at`
FROM `nuoyuan_product_category` pc
WHERE pc.`name` LIKE '%服务%' OR pc.`name` LIKE '%基因编辑%'
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `en_name` = VALUES(`en_name`),
  `description` = VALUES(`description`),
  `icon` = VALUES(`icon`),
  `sort` = VALUES(`sort`),
  `status` = VALUES(`status`);

INSERT IGNORE INTO `nuoyuan_service`
(`id`, `service_code`, `goods_code`, `category_id`, `name`, `en_name`, `short_desc`, `spec_text`, `core_advantage`, `content`, `detail_richtext`, `cover_image`, `banner_image`, `gallery_json`, `sort`, `is_hot`, `status`, `view_count`, `created_at`, `updated_at`)
SELECT
  p.`id`,
  p.`product_code`,
  p.`goods_code`,
  p.`category_id`,
  p.`name`,
  p.`en_name`,
  p.`short_desc`,
  p.`spec_text`,
  p.`core_advantage`,
  p.`content`,
  p.`detail_richtext`,
  p.`cover_image`,
  p.`banner_image`,
  p.`gallery_json`,
  p.`sort`,
  p.`is_hot`,
  p.`status`,
  p.`view_count`,
  p.`created_at`,
  p.`updated_at`
FROM `nuoyuan_product` p
WHERE p.`category_id` IN (
  SELECT c.`id` FROM `nuoyuan_product_category` c WHERE c.`name` LIKE '%服务%' OR c.`name` LIKE '%基因编辑%'
);

UPDATE `nuoyuan_service` s
JOIN `nuoyuan_product` p ON p.`id` = s.`id`
SET
  s.`service_code` = p.`product_code`,
  s.`goods_code` = p.`goods_code`,
  s.`category_id` = p.`category_id`,
  s.`name` = p.`name`,
  s.`en_name` = p.`en_name`,
  s.`short_desc` = p.`short_desc`,
  s.`spec_text` = p.`spec_text`,
  s.`core_advantage` = p.`core_advantage`,
  s.`content` = p.`content`,
  s.`detail_richtext` = p.`detail_richtext`,
  s.`cover_image` = p.`cover_image`,
  s.`banner_image` = p.`banner_image`,
  s.`gallery_json` = p.`gallery_json`,
  s.`sort` = p.`sort`,
  s.`is_hot` = p.`is_hot`,
  s.`status` = p.`status`
WHERE p.`category_id` IN (
  SELECT c.`id` FROM `nuoyuan_product_category` c WHERE c.`name` LIKE '%服务%' OR c.`name` LIKE '%基因编辑%'
);
