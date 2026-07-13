import { getSeoMeta } from '@/api'

function upsertMeta(name, content, attr = 'name') {
  if (!content) return
  let el = document.head.querySelector(`meta[${attr}="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

export async function applySeoMeta(params = {}) {
  try {
    const seo = await getSeoMeta(params)
    if (seo.title) document.title = seo.title
    upsertMeta('keywords', seo.keywords || '')
    upsertMeta('description', seo.description || '')
    upsertMeta('og:title', seo.title || '', 'property')
    upsertMeta('og:description', seo.description || '', 'property')
    upsertMeta('og:image', seo.image || '', 'property')
  } catch (err) {
    console.error('SEO加载失败', err.message)
  }
}
