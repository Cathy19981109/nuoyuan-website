/**
 * Shared product/service variant & detail media helpers (no stock fields)
 */
function safeParseArray(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    const val = JSON.parse(raw);
    return Array.isArray(val) ? val : [];
  } catch {
    return [];
  }
}

function parseSpecOptions(specText) {
  if (!specText) return [];
  const rows = String(specText)
    .split(/\r?\n|[|；;]/g)
    .map((v) => v.trim())
    .filter(Boolean);
  return Array.from(new Set(rows)).slice(0, 20);
}

function normalizeVariants(input = []) {
  const rows = Array.isArray(input) ? input : safeParseArray(input);
  return rows
    .map((item, idx) => {
      const name = String(item?.name || '').trim();
      if (!name) return null;
      return {
        id: String(item?.id || `v_${Date.now().toString(36)}_${idx}`),
        name,
        goods_code: String(item?.goods_code || '').trim() || null,
        price: item?.price === null || item?.price === undefined ? '' : String(item.price).trim(),
        image_url: String(item?.image_url || '').trim() || null,
        sort: Number.isFinite(Number(item?.sort)) ? Number(item.sort) : idx,
        status: Number(item?.status) === 0 ? 0 : 1,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.sort - b.sort)
    .slice(0, 50);
}

function normalizeDetailMedia(input = []) {
  const rows = Array.isArray(input) ? input : safeParseArray(input);
  return rows
    .map((item, idx) => {
      const url = String(item?.url || '').trim();
      if (!url) return null;
      const type = String(item?.type || 'image').trim() === 'video' ? 'video' : 'image';
      return {
        type,
        name: String(item?.name || (type === 'video' ? `视频${idx + 1}` : `图片${idx + 1}`)).trim(),
        url,
        caption: String(item?.caption || '').trim(),
      };
    })
    .filter(Boolean)
    .slice(0, 30);
}

function normalizeSpecDocs(input = []) {
  const rows = Array.isArray(input) ? input : safeParseArray(input);
  return rows
    .map((item, idx) => {
      const url = String(item?.url || '').trim();
      if (!url) return null;
      return {
        name: String(item?.name || `说明书${idx + 1}`).trim(),
        url,
        size: Number(item?.size) || null,
      };
    })
    .filter(Boolean)
    .slice(0, 20);
}

function deriveSpecTextFromVariants(variants = []) {
  return variants.filter((v) => v.status !== 0).map((v) => v.name).join('\n');
}

module.exports = {
  safeParseArray,
  parseSpecOptions,
  normalizeVariants,
  normalizeDetailMedia,
  normalizeSpecDocs,
  deriveSpecTextFromVariants,
};
