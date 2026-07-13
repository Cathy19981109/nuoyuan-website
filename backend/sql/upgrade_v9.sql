-- V9：服务管理补齐筛选标签能力（对齐产品管理）
SET @db_name = DATABASE();

SET @add_service_product_type_sql = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = @db_name
        AND TABLE_NAME = 'nuoyuan_service'
        AND COLUMN_NAME = 'product_type'
    ),
    'SELECT ''service product_type exists''',
    'ALTER TABLE `nuoyuan_service` ADD COLUMN `product_type` text DEFAULT NULL COMMENT ''服务类型多标签，英文逗号分隔'' AFTER `video_url`'
  )
);
PREPARE stmt1 FROM @add_service_product_type_sql;
EXECUTE stmt1;
DEALLOCATE PREPARE stmt1;

SET @add_service_app_type_sql = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = @db_name
        AND TABLE_NAME = 'nuoyuan_service'
        AND COLUMN_NAME = 'app_type'
    ),
    'SELECT ''service app_type exists''',
    'ALTER TABLE `nuoyuan_service` ADD COLUMN `app_type` text DEFAULT NULL COMMENT ''应用分类多标签，英文逗号分隔'' AFTER `product_type`'
  )
);
PREPARE stmt2 FROM @add_service_app_type_sql;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

SET @add_service_level_tag_sql = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = @db_name
        AND TABLE_NAME = 'nuoyuan_service'
        AND COLUMN_NAME = 'level_tag'
    ),
    'SELECT ''service level_tag exists''',
    'ALTER TABLE `nuoyuan_service` ADD COLUMN `level_tag` text DEFAULT NULL COMMENT ''级别多标签，英文逗号分隔'' AFTER `app_type`'
  )
);
PREPARE stmt3 FROM @add_service_level_tag_sql;
EXECUTE stmt3;
DEALLOCATE PREPARE stmt3;

CREATE TABLE IF NOT EXISTS `nuoyuan_service_filter_tag` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tag_group` varchar(30) NOT NULL COMMENT 'product_type/app_type/level_tag',
  `tag_name` varchar(80) NOT NULL COMMENT '标签名称',
  `sort` int NOT NULL DEFAULT 0 COMMENT '排序',
  `status` tinyint(1) NOT NULL DEFAULT 1 COMMENT '状态 1启用 0停用',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_group_name` (`tag_group`, `tag_name`),
  KEY `idx_group_sort` (`tag_group`, `sort`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='服务筛选标签';

INSERT INTO `nuoyuan_service_filter_tag` (`tag_group`, `tag_name`, `sort`, `status`)
SELECT 'product_type', '基因编辑技术服务', 1, 1
WHERE NOT EXISTS (
  SELECT 1 FROM `nuoyuan_service_filter_tag` WHERE `tag_group` = 'product_type' AND `tag_name` = '基因编辑技术服务'
);
INSERT INTO `nuoyuan_service_filter_tag` (`tag_group`, `tag_name`, `sort`, `status`)
SELECT 'product_type', '载体构建服务', 2, 1
WHERE NOT EXISTS (
  SELECT 1 FROM `nuoyuan_service_filter_tag` WHERE `tag_group` = 'product_type' AND `tag_name` = '载体构建服务'
);
INSERT INTO `nuoyuan_service_filter_tag` (`tag_group`, `tag_name`, `sort`, `status`)
SELECT 'app_type', '细胞编辑', 1, 1
WHERE NOT EXISTS (
  SELECT 1 FROM `nuoyuan_service_filter_tag` WHERE `tag_group` = 'app_type' AND `tag_name` = '细胞编辑'
);
INSERT INTO `nuoyuan_service_filter_tag` (`tag_group`, `tag_name`, `sort`, `status`)
SELECT 'app_type', '基因功能验证', 2, 1
WHERE NOT EXISTS (
  SELECT 1 FROM `nuoyuan_service_filter_tag` WHERE `tag_group` = 'app_type' AND `tag_name` = '基因功能验证'
);
INSERT INTO `nuoyuan_service_filter_tag` (`tag_group`, `tag_name`, `sort`, `status`)
SELECT 'level_tag', '常规科研级', 1, 1
WHERE NOT EXISTS (
  SELECT 1 FROM `nuoyuan_service_filter_tag` WHERE `tag_group` = 'level_tag' AND `tag_name` = '常规科研级'
);
INSERT INTO `nuoyuan_service_filter_tag` (`tag_group`, `tag_name`, `sort`, `status`)
SELECT 'level_tag', '转化研究级', 2, 1
WHERE NOT EXISTS (
  SELECT 1 FROM `nuoyuan_service_filter_tag` WHERE `tag_group` = 'level_tag' AND `tag_name` = '转化研究级'
);
