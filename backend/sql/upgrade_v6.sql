USE `nuoyuan_website`;

-- 全站SEO分享图配置
INSERT INTO `nuoyuan_config` (`config_key`, `config_value`, `name`, `description`, `sort`)
SELECT 'seo_share_img', '', '全站分享缩略图', '16:9，1200x675，png/jpg/webp，<=1MB', 9
WHERE NOT EXISTS (
  SELECT 1 FROM `nuoyuan_config` WHERE `config_key` = 'seo_share_img'
);

-- 栏目SEO字段（页面）
ALTER TABLE `nuoyuan_page`
  ADD COLUMN `page_title` varchar(255) DEFAULT NULL COMMENT '栏目SEO标题' AFTER `seo_description`,
  ADD COLUMN `page_keywords` varchar(500) DEFAULT NULL COMMENT '栏目SEO关键词' AFTER `page_title`,
  ADD COLUMN `page_desc` varchar(1000) DEFAULT NULL COMMENT '栏目SEO描述' AFTER `page_keywords`,
  ADD COLUMN `page_seo_img` varchar(500) DEFAULT NULL COMMENT '栏目SEO配图' AFTER `page_desc`;

-- 产品SEO字段（单品）
ALTER TABLE `nuoyuan_product`
  ADD COLUMN `seo_title` varchar(255) DEFAULT NULL COMMENT '单品SEO标题' AFTER `detail_richtext`,
  ADD COLUMN `seo_keywords` varchar(500) DEFAULT NULL COMMENT '单品SEO关键词' AFTER `seo_title`,
  ADD COLUMN `seo_desc` varchar(1000) DEFAULT NULL COMMENT '单品SEO描述' AFTER `seo_keywords`,
  ADD COLUMN `seo_img` varchar(500) DEFAULT NULL COMMENT '单品SEO配图' AFTER `seo_desc`;

-- 新闻SEO字段（单条资讯）
ALTER TABLE `nuoyuan_news`
  ADD COLUMN `seo_title` varchar(255) DEFAULT NULL COMMENT '资讯SEO标题' AFTER `content`,
  ADD COLUMN `seo_keywords` varchar(500) DEFAULT NULL COMMENT '资讯SEO关键词' AFTER `seo_title`,
  ADD COLUMN `seo_desc` varchar(1000) DEFAULT NULL COMMENT '资讯SEO描述' AFTER `seo_keywords`,
  ADD COLUMN `seo_img` varchar(500) DEFAULT NULL COMMENT '资讯SEO配图' AFTER `seo_desc`;

-- 数据迁移：老SEO字段兜底到新栏目字段
UPDATE `nuoyuan_page`
SET
  `page_title` = COALESCE(`page_title`, `title`),
  `page_keywords` = COALESCE(`page_keywords`, `seo_keywords`),
  `page_desc` = COALESCE(`page_desc`, `seo_description`)
WHERE 1 = 1;
