const pool = require('../config/db');

function truncate(text, max = 80) {
  const s = String(text || '').replace(/\s+/g, ' ').trim();
  if (!s) return '';
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

async function search(keyword, { page = 1, pageSize = 8 } = {}) {
  if (!keyword || !keyword.trim()) {
    return {
      products: [],
      services: [],
      suggestions: [],
    };
  }

  const raw = keyword.trim();
  const kw = `%${raw}%`;
  const limit = Math.min(Math.max(parseInt(pageSize, 10) || 8, 1), 20);

  const [products] = await pool.query(
    `SELECT id, name, short_desc, cover_image, product_code, goods_code, 'product' AS type
     FROM nuoyuan_product
     WHERE status = 1
       AND (
         name LIKE ? OR en_name LIKE ? OR short_desc LIKE ?
         OR product_code LIKE ? OR goods_code LIKE ?
       )
     ORDER BY sort ASC, id DESC
     LIMIT ?`,
    [kw, kw, kw, kw, kw, limit]
  );

  const [services] = await pool.query(
    `SELECT id, name, short_desc, cover_image, service_code, goods_code, 'service' AS type
     FROM nuoyuan_service
     WHERE status = 1
       AND (
         name LIKE ? OR en_name LIKE ? OR short_desc LIKE ?
         OR service_code LIKE ? OR goods_code LIKE ?
       )
     ORDER BY sort ASC, id DESC
     LIMIT ?`,
    [kw, kw, kw, kw, kw, limit]
  );

  const suggestions = [
    ...products.map((item) => ({
      type: 'product',
      typeLabel: '产品',
      id: item.id,
      title: item.name,
      desc: truncate(item.short_desc || item.product_code || item.goods_code),
      to: `/products/${item.id}`,
    })),
    ...services.map((item) => ({
      type: 'service',
      typeLabel: '服务',
      id: item.id,
      title: item.name,
      desc: truncate(item.short_desc || item.service_code || item.goods_code),
      to: `/services/${item.id}`,
    })),
  ].slice(0, 12);

  return {
    products,
    services,
    suggestions,
  };
}

module.exports = { search };
