USE `nuoyuan_website`;

-- 页面模块结构化字段（保留module_data兼容旧数据）
ALTER TABLE `nuoyuan_page_module`
  ADD COLUMN `main_title` varchar(255) DEFAULT NULL COMMENT '主标题' AFTER `module_template`,
  ADD COLUMN `sub_title` varchar(255) DEFAULT NULL COMMENT '副标题' AFTER `main_title`,
  ADD COLUMN `body_text` longtext DEFAULT NULL COMMENT '正文' AFTER `sub_title`,
  ADD COLUMN `image_list_json` longtext DEFAULT NULL COMMENT '图片数组JSON' AFTER `body_text`,
  ADD COLUMN `link_url` varchar(500) DEFAULT NULL COMMENT '跳转链接' AFTER `image_list_json`,
  ADD COLUMN `table_text` longtext DEFAULT NULL COMMENT '表格文本' AFTER `link_url`,
  ADD COLUMN `qa_question` varchar(500) DEFAULT NULL COMMENT 'FAQ问题' AFTER `table_text`,
  ADD COLUMN `qa_answer` longtext DEFAULT NULL COMMENT 'FAQ回答' AFTER `qa_question`,
  ADD COLUMN `card_items_json` longtext DEFAULT NULL COMMENT '卡片列表JSON' AFTER `qa_answer`,
  ADD COLUMN `extra_json` longtext DEFAULT NULL COMMENT '扩展字段JSON' AFTER `card_items_json`;

-- 回收站增加排序字段，支持拖拽
ALTER TABLE `nuoyuan_module_recycle`
  ADD COLUMN `sort` int NOT NULL DEFAULT '0' COMMENT '排序值' AFTER `module_template`;

UPDATE `nuoyuan_page_module`
SET
  `main_title` = COALESCE(`main_title`, JSON_UNQUOTE(JSON_EXTRACT(`module_data`, '$.main_title'))),
  `sub_title` = COALESCE(`sub_title`, JSON_UNQUOTE(JSON_EXTRACT(`module_data`, '$.sub_title'))),
  `body_text` = COALESCE(`body_text`, JSON_UNQUOTE(JSON_EXTRACT(`module_data`, '$.body_text'))),
  `link_url` = COALESCE(`link_url`, JSON_UNQUOTE(JSON_EXTRACT(`module_data`, '$.link_url'))),
  `table_text` = COALESCE(`table_text`, JSON_UNQUOTE(JSON_EXTRACT(`module_data`, '$.table_text'))),
  `qa_question` = COALESCE(`qa_question`, JSON_UNQUOTE(JSON_EXTRACT(`module_data`, '$.qa_question'))),
  `qa_answer` = COALESCE(`qa_answer`, JSON_UNQUOTE(JSON_EXTRACT(`module_data`, '$.qa_answer')))
WHERE `module_data` IS NOT NULL;

