-- V10：产品/服务筛选系统升级为“动态筛选大类”
SET @db_name = DATABASE();

CREATE TABLE IF NOT EXISTS `nuoyuan_product_filter_group` (
  `id` int NOT NULL AUTO_INCREMENT,
  `group_key` varchar(64) NOT NULL,
  `group_title` varchar(80) NOT NULL,
  `sort` int NOT NULL DEFAULT 0,
  `status` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_group_key` (`group_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='产品筛选分组';

CREATE TABLE IF NOT EXISTS `nuoyuan_service_filter_group` (
  `id` int NOT NULL AUTO_INCREMENT,
  `group_key` varchar(64) NOT NULL,
  `group_title` varchar(80) NOT NULL,
  `sort` int NOT NULL DEFAULT 0,
  `status` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_group_key` (`group_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='服务筛选分组';

SET @add_product_filter_json_sql = (
  SELECT IF(
    EXISTS(
      SELECT 1 FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = @db_name
        AND TABLE_NAME = 'nuoyuan_product'
        AND COLUMN_NAME = 'filter_tags_json'
    ),
    'SELECT ''product filter_tags_json exists''',
    'ALTER TABLE `nuoyuan_product` ADD COLUMN `filter_tags_json` text DEFAULT NULL COMMENT ''动态筛选标签JSON'' AFTER `level_tag`'
  )
);
PREPARE stmt1 FROM @add_product_filter_json_sql;
EXECUTE stmt1;
DEALLOCATE PREPARE stmt1;

SET @add_service_filter_json_sql = (
  SELECT IF(
    EXISTS(
      SELECT 1 FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = @db_name
        AND TABLE_NAME = 'nuoyuan_service'
        AND COLUMN_NAME = 'filter_tags_json'
    ),
    'SELECT ''service filter_tags_json exists''',
    'ALTER TABLE `nuoyuan_service` ADD COLUMN `filter_tags_json` text DEFAULT NULL COMMENT ''动态筛选标签JSON'' AFTER `level_tag`'
  )
);
PREPARE stmt2 FROM @add_service_filter_json_sql;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

INSERT IGNORE INTO `nuoyuan_product_filter_group` (`group_key`, `group_title`, `sort`, `status`)
VALUES ('product_type', '产品类型标签', 0, 1), ('app_type', '应用分类标签', 1, 1), ('level_tag', '级别标签', 2, 1);

INSERT IGNORE INTO `nuoyuan_service_filter_group` (`group_key`, `group_title`, `sort`, `status`)
VALUES ('product_type', '服务类型标签', 0, 1), ('app_type', '应用分类标签', 1, 1), ('level_tag', '级别标签', 2, 1);

UPDATE `nuoyuan_product`
SET `filter_tags_json` = JSON_OBJECT(
  'product_type', IFNULL(NULLIF(`product_type`, ''), ''),
  'app_type', IFNULL(NULLIF(`app_type`, ''), ''),
  'level_tag', IFNULL(NULLIF(`level_tag`, ''), '')
)
WHERE `filter_tags_json` IS NULL;

UPDATE `nuoyuan_service`
SET `filter_tags_json` = JSON_OBJECT(
  'product_type', IFNULL(NULLIF(`product_type`, ''), ''),
  'app_type', IFNULL(NULLIF(`app_type`, ''), ''),
  'level_tag', IFNULL(NULLIF(`level_tag`, ''), '')
)
WHERE `filter_tags_json` IS NULL;
