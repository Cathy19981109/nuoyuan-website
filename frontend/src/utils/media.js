/**
 * Resolve CMS media paths for local (Vite proxy) and production (Vercel + Railway).
 * DB stores paths like `/uploads/images/xxx.png`. On Vercel those must hit the API host,
 * not the frontend origin.
 */
export function getApiOrigin() {
  const base = String(import.meta.env.VITE_API_BASE_URL || '').trim()
  if (!base || base.startsWith('/')) return ''
  try {
    const u = new URL(base)
    return u.origin
  } catch {
    return base.replace(/\/api(?:\/admin)?\/?$/i, '').replace(/\/$/, '')
  }
}

export function toPublicMediaUrl(url) {
  if (!url) return ''
  const raw = String(url).trim()
  if (!raw) return ''
  if (/^(https?:|data:|blob:)/i.test(raw)) return raw

  let path = raw
  if (path.startsWith('/api/')) path = path.slice(4)
  else if (path.startsWith('api/')) path = `/${path.slice(4)}`
  else if (!path.startsWith('/')) path = `/${path}`

  const origin = getApiOrigin()
  // Absolute API host in production; keep relative in local so Vite proxy can serve /uploads
  if (origin && (path.startsWith('/uploads/') || path.startsWith('/static/'))) {
    return `${origin}${path}`
  }
  return path
}
