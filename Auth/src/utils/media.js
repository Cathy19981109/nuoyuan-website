export function toPublicMediaUrl(url) {
  if (!url) return ''
  const raw = String(url).trim()
  if (!raw) return ''
  if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('data:') || raw.startsWith('blob:')) return raw
  if (raw.startsWith('/api/')) return raw.replace(/^\/api/, '')
  if (raw.startsWith('api/')) return `/${raw.replace(/^api\//, '')}`
  return raw.startsWith('/') ? raw : `/${raw}`
}
