/** 动态设置浏览器标签 favicon */
export function applyFavicon(url) {
  const raw = String(url || '').trim()
  if (!raw) return

  const href = raw.includes('?') ? raw : `${raw}?v=${encodeURIComponent(raw)}`
  const rels = ['icon', 'shortcut icon']

  rels.forEach((rel) => {
    let link = document.head.querySelector(`link[rel="${rel}"]`)
    if (!link) {
      link = document.createElement('link')
      link.setAttribute('rel', rel)
      document.head.appendChild(link)
    }
    const lower = raw.toLowerCase()
    if (lower.endsWith('.svg')) link.setAttribute('type', 'image/svg+xml')
    else if (lower.endsWith('.png')) link.setAttribute('type', 'image/png')
    else if (lower.endsWith('.ico')) link.setAttribute('type', 'image/x-icon')
    else link.removeAttribute('type')
    link.setAttribute('href', href)
  })
}
