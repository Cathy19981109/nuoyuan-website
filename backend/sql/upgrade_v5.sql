USE `nuoyuan_website`;

-- 页面模块：统一5类模板的结构化扩展字段（兼容老数据）
ALTER TABLE `nuoyuan_page_module`
  ADD COLUMN `layout_mode` varchar(50) DEFAULT NULL COMMENT '图文分栏布局模式（图内/图上/图下/图左/图右）' AFTER `sub_title`,
  ADD COLUMN `video_url` varchar(500) DEFAULT NULL COMMENT '视频文件地址或文件名' AFTER `image_list_json`,
  ADD COLUMN `jump_type` varchar(30) DEFAULT NULL COMMENT '跳转方式：external/product' AFTER `link_url`,
  ADD COLUMN `jump_product_code` varchar(20) DEFAULT NULL COMMENT '绑定产品5位编号' AFTER `jump_type`;

-- 页面信息：为页面编辑Tab排序提供字段
ALTER TABLE `nuoyuan_page`
  ADD COLUMN `tab_sort` int NOT NULL DEFAULT 0 COMMENT '页面编辑Tab排序' AFTER `status`;

-- 导航：为导航信息上传文件模式补充类型（兼容老字段）
ALTER TABLE `nuoyuan_nav`
  ADD COLUMN `dropdown_banner_type` varchar(20) DEFAULT 'image' COMMENT '下拉横幅类型 image/video' AFTER `dropdown_banner`;

-- 询价：增强多条件检索字段索引
ALTER TABLE `nuoyuan_inquiry`
  ADD KEY `idx_inquiry_name` (`name`),
  ADD KEY `idx_inquiry_phone` (`phone`),
  ADD KEY `idx_inquiry_email` (`email`),
  ADD KEY `idx_inquiry_company` (`company`),
  ADD KEY `idx_inquiry_product` (`product_name`);

-- 初始化 tab_sort，保证旧数据有序
UPDATE `nuoyuan_page`
SET `tab_sort` = `id`
WHERE `tab_sort` = 0;

-- 兼容：从 module_data 回填新增结构字段
UPDATE `nuoyuan_page_module`
SET `layout_mode` = JSON_UNQUOTE(JSON_EXTRACT(`module_data`, '$.layout_mode'))
WHERE `layout_mode` IS NULL;

UPDATE `nuoyuan_page_module`
SET `video_url` = JSON_UNQUOTE(JSON_EXTRACT(`module_data`, '$.video_url'))
WHERE `video_url` IS NULL;

UPDATE `nuoyuan_page_module`
SET `jump_type` = JSON_UNQUOTE(JSON_EXTRACT(`module_data`, '$.jump_type'))
WHERE `jump_type` IS NULL;

UPDATE `nuoyuan_page_module`
SET `jump_product_code` = JSON_UNQUOTE(JSON_EXTRACT(`module_data`, '$.jump_product_code'))
WHERE `jump_product_code` IS NULL;
