-- V11：产品变体 + 详情规格媒体 + 说明书文档
USE `nuoyuan_website`;

-- 若列已存在可忽略报错后继续执行后续语句

ALTER TABLE `nuoyuan_product`
  ADD COLUMN `variants_json` longtext DEFAULT NULL COMMENT '变体数组JSON' AFTER `spec_text`;

ALTER TABLE `nuoyuan_product`
  ADD COLUMN `detail_media_json` longtext DEFAULT NULL COMMENT '详情规格媒体(图/视频)JSON' AFTER `detail_richtext`;

ALTER TABLE `nuoyuan_product`
  ADD COLUMN `spec_docs_json` longtext DEFAULT NULL COMMENT '规格说明书/PDF JSON' AFTER `detail_media_json`;
