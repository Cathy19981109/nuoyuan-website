/**
 * Idempotent: add SEO columns expected by seoService (upgrade_v6).
 * Run: node src/scripts/applySeoColumns.js
 */
require('dotenv').config()
const mysql = require('mysql2/promise')

async function columnExists(conn, table, column) {
  const [rows] = await conn.query(
    `SELECT 1 AS ok FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1`,
    [table, column]
  )
  return rows.length > 0
}

async function ensureColumn(conn, table, column, ddl) {
  if (await columnExists(conn, table, column)) {
    console.log(`skip ${table}.${column}`)
    return
  }
  await conn.query(`ALTER TABLE \`${table}\` ADD COLUMN ${ddl}`)
  console.log(`added ${table}.${column}`)
}

;(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'nuoyuan_website',
  })

  await ensureColumn(conn, 'nuoyuan_page', 'page_title',
    "`page_title` varchar(255) DEFAULT NULL COMMENT '栏目SEO标题' AFTER `seo_description`")
  await ensureColumn(conn, 'nuoyuan_page', 'page_keywords',
    "`page_keywords` varchar(500) DEFAULT NULL COMMENT '栏目SEO关键词' AFTER `page_title`")
  await ensureColumn(conn, 'nuoyuan_page', 'page_desc',
    "`page_desc` varchar(1000) DEFAULT NULL COMMENT '栏目SEO描述' AFTER `page_keywords`")
  await ensureColumn(conn, 'nuoyuan_page', 'page_seo_img',
    "`page_seo_img` varchar(500) DEFAULT NULL COMMENT '栏目SEO配图' AFTER `page_desc`")

  await ensureColumn(conn, 'nuoyuan_product', 'seo_title',
    "`seo_title` varchar(255) DEFAULT NULL COMMENT '单品SEO标题' AFTER `detail_richtext`")
  await ensureColumn(conn, 'nuoyuan_product', 'seo_keywords',
    "`seo_keywords` varchar(500) DEFAULT NULL COMMENT '单品SEO关键词' AFTER `seo_title`")
  await ensureColumn(conn, 'nuoyuan_product', 'seo_desc',
    "`seo_desc` varchar(1000) DEFAULT NULL COMMENT '单品SEO描述' AFTER `seo_keywords`")
  await ensureColumn(conn, 'nuoyuan_product', 'seo_img',
    "`seo_img` varchar(500) DEFAULT NULL COMMENT '单品SEO配图' AFTER `seo_desc`")

  // If detail_richtext missing, append without AFTER
  if (!(await columnExists(conn, 'nuoyuan_product', 'seo_title'))) {
    // noop — ensureColumn already handled; fallback path below if AFTER failed
  }

  await ensureColumn(conn, 'nuoyuan_news', 'seo_title',
    "`seo_title` varchar(255) DEFAULT NULL COMMENT '资讯SEO标题' AFTER `content`")
  await ensureColumn(conn, 'nuoyuan_news', 'seo_keywords',
    "`seo_keywords` varchar(500) DEFAULT NULL COMMENT '资讯SEO关键词' AFTER `seo_title`")
  await ensureColumn(conn, 'nuoyuan_news', 'seo_desc',
    "`seo_desc` varchar(1000) DEFAULT NULL COMMENT '资讯SEO描述' AFTER `seo_keywords`")
  await ensureColumn(conn, 'nuoyuan_news', 'seo_img',
    "`seo_img` varchar(500) DEFAULT NULL COMMENT '资讯SEO配图' AFTER `seo_desc`")

  await ensureColumn(conn, 'nuoyuan_service', 'seo_title',
    "`seo_title` varchar(255) DEFAULT NULL COMMENT '服务SEO标题' AFTER `detail_richtext`")
  await ensureColumn(conn, 'nuoyuan_service', 'seo_keywords',
    "`seo_keywords` varchar(500) DEFAULT NULL COMMENT '服务SEO关键词' AFTER `seo_title`")
  await ensureColumn(conn, 'nuoyuan_service', 'seo_desc',
    "`seo_desc` varchar(1000) DEFAULT NULL COMMENT '服务SEO描述' AFTER `seo_keywords`")
  await ensureColumn(conn, 'nuoyuan_service', 'seo_img',
    "`seo_img` varchar(500) DEFAULT NULL COMMENT '服务SEO配图' AFTER `seo_desc`")

  await conn.query(
    `INSERT INTO nuoyuan_config (config_key, config_value, name, description, sort)
     SELECT 'seo_share_img', '', '全站分享缩略图', '16:9，1200x675，png/jpg/webp，<=1MB', 9
     WHERE NOT EXISTS (SELECT 1 FROM nuoyuan_config WHERE config_key = 'seo_share_img')`
  )

  await conn.query(
    `UPDATE nuoyuan_page SET
       page_title = COALESCE(page_title, title),
       page_keywords = COALESCE(page_keywords, seo_keywords),
       page_desc = COALESCE(page_desc, seo_description)
     WHERE 1 = 1`
  )

  console.log('SEO columns ready')
  await conn.end()
})().catch(async (err) => {
  console.error(err)
  process.exit(1)
})
