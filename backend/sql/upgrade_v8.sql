-- V8：权限管理增强（管理员绑定邮箱和手机号）
-- 兼容 MySQL 5.7/8.0：通过 information_schema 判断后再执行 ALTER

SET @db_name = DATABASE();

SET @add_email_sql = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = @db_name
        AND TABLE_NAME = 'nuoyuan_admin'
        AND COLUMN_NAME = 'email'
    ),
    'SELECT ''email column exists''',
    'ALTER TABLE `nuoyuan_admin` ADD COLUMN `email` varchar(120) DEFAULT NULL COMMENT ''绑定邮箱'' AFTER `real_name`'
  )
);
PREPARE stmt1 FROM @add_email_sql;
EXECUTE stmt1;
DEALLOCATE PREPARE stmt1;

SET @add_phone_sql = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = @db_name
        AND TABLE_NAME = 'nuoyuan_admin'
        AND COLUMN_NAME = 'phone'
    ),
    'SELECT ''phone column exists''',
    'ALTER TABLE `nuoyuan_admin` ADD COLUMN `phone` varchar(20) DEFAULT NULL COMMENT ''绑定手机号'' AFTER `email`'
  )
);
PREPARE stmt2 FROM @add_phone_sql;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

SET @add_product_video_sql = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = @db_name
        AND TABLE_NAME = 'nuoyuan_product'
        AND COLUMN_NAME = 'video_url'
    ),
    'SELECT ''product video_url exists''',
    'ALTER TABLE `nuoyuan_product` ADD COLUMN `video_url` varchar(500) DEFAULT NULL COMMENT ''产品视频地址'' AFTER `gallery_json`'
  )
);
PREPARE stmt3 FROM @add_product_video_sql;
EXECUTE stmt3;
DEALLOCATE PREPARE stmt3;

SET @add_service_video_sql = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = @db_name
        AND TABLE_NAME = 'nuoyuan_service'
        AND COLUMN_NAME = 'video_url'
    ),
    'SELECT ''service video_url exists''',
    'ALTER TABLE `nuoyuan_service` ADD COLUMN `video_url` varchar(500) DEFAULT NULL COMMENT ''服务视频地址'' AFTER `gallery_json`'
  )
);
PREPARE stmt4 FROM @add_service_video_sql;
EXECUTE stmt4;
DEALLOCATE PREPARE stmt4;

INSERT INTO `nuoyuan_config` (`config_key`, `config_value`, `name`, `description`, `sort`)
SELECT 'contact_map_note', '', '地图说明', '联系我们页面右侧地图区域说明文字', 26
WHERE NOT EXISTS (
  SELECT 1 FROM `nuoyuan_config` WHERE `config_key` = 'contact_map_note'
);

INSERT INTO `nuoyuan_config` (`config_key`, `config_value`, `name`, `description`, `sort`)
SELECT 'contact_map_embed_url', '', '高德地图嵌入链接', '联系我们页面右侧地图 iframe 地址', 27
WHERE NOT EXISTS (
  SELECT 1 FROM `nuoyuan_config` WHERE `config_key` = 'contact_map_embed_url'
);

INSERT INTO `nuoyuan_config` (`config_key`, `config_value`, `name`, `description`, `sort`)
SELECT 'contact_map_nav_url', '', '高德导航跳转链接', '点击地图后跳转到高德导航页面', 28
WHERE NOT EXISTS (
  SELECT 1 FROM `nuoyuan_config` WHERE `config_key` = 'contact_map_nav_url'
);

