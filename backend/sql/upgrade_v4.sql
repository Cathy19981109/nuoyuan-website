USE `nuoyuan_website`;

-- 产品：商品编码、详情富文本、头部轮播图与规格
ALTER TABLE `nuoyuan_product`
  ADD COLUMN `goods_code` varchar(50) DEFAULT NULL COMMENT '商品编码（可批量导入）' AFTER `product_code`,
  ADD COLUMN `spec_text` varchar(500) DEFAULT NULL COMMENT '产品规格文本' AFTER `short_desc`,
  ADD COLUMN `detail_richtext` longtext DEFAULT NULL COMMENT '产品详情富文本（可含图文链接）' AFTER `content`,
  ADD COLUMN `gallery_json` longtext DEFAULT NULL COMMENT '产品头部轮播图/视频JSON数组' AFTER `banner_image`;

ALTER TABLE `nuoyuan_product`
  ADD KEY `idx_goods_code` (`goods_code`);

-- 导航下拉横幅由URL改文件路径语义（字段复用，不新增）
UPDATE `nuoyuan_nav`
SET `dropdown_banner` = NULL
WHERE `dropdown_banner` = '';
