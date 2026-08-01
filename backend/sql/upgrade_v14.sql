-- 子导航模块：支持父子嵌套
USE `nuoyuan_website`;

ALTER TABLE `nuoyuan_page_module`
  ADD COLUMN `parent_id` bigint unsigned NOT NULL DEFAULT 0 COMMENT '父模块ID，0=顶级' AFTER `page_key`,
  ADD KEY `idx_page_parent` (`page_key`, `parent_id`);
