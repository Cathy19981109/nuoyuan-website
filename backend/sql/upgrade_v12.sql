-- V12：技术服务变体 + 详情规格媒体 + 说明书（对齐产品中心最终版，不含库存）
USE `nuoyuan_website`;

ALTER TABLE `nuoyuan_service`
  ADD COLUMN `variants_json` longtext DEFAULT NULL COMMENT '变体数组JSON' AFTER `spec_text`;

ALTER TABLE `nuoyuan_service`
  ADD COLUMN `detail_media_json` longtext DEFAULT NULL COMMENT '详情规格媒体(图/视频)JSON' AFTER `detail_richtext`;

ALTER TABLE `nuoyuan_service`
  ADD COLUMN `spec_docs_json` longtext DEFAULT NULL COMMENT '规格说明书/PDF JSON' AFTER `detail_media_json`;
