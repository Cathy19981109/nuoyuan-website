import { computed } from 'vue'

export const DEFAULT_CATALOG_BANNER =
  '/uploads/images/img-1785568646891-xal7uj.jpg'

function firstImageUrl(row) {
  const list = Array.isArray(row?.image_list_json) ? row.image_list_json : []
  if (!list.length) return ''
  const first = list[0]
  if (typeof first === 'string') return first
  return first?.url || ''
}

export function resolveBannerImage(modules = [], fallback = DEFAULT_CATALOG_BANNER) {
  for (const row of modules || []) {
    const url = firstImageUrl(row)
    // Skip legacy demo placeholders that are often missing on disk
    if (url && !/\/demo[-_]/.test(url)) return url
  }
  return fallback
}

/**
 * Shared catalog module helpers for 产品中心 / 技术服务.
 * Hero image prefers banner module image; falls back to a full-width module
 * that has been absorbed into the hero (and should not render again below).
 */
export function useCatalogModules(pageModules, options = {}) {
  const {
    bannerSystemKey,
    bannerModuleName,
    listSystemKey,
    listModuleNameIncludes,
  } = options

  function isBannerModule(row) {
    const key = row?.extra_json?.system_key
    const name = String(row?.module_name || '')
    return key === bannerSystemKey || name === bannerModuleName
  }

  function isListSystemModule(row) {
    if (!listSystemKey && !listModuleNameIncludes) return false
    const key = row?.extra_json?.system_key
    const name = String(row?.module_name || '')
    if (listSystemKey && key === listSystemKey) return true
    if (listModuleNameIncludes && name.includes(listModuleNameIncludes)) return true
    return false
  }

  /** Full-bleed images are folded into CatalogHeroBanner, not listed again. */
  function isHeroAbsorbedModule(row) {
    return row?.module_template === 'full_width_single_image'
  }

  const bannerModule = computed(() => pageModules.value.find((m) => isBannerModule(m)) || null)

  const listModuleIndex = computed(() => pageModules.value.findIndex((m) => isListSystemModule(m)))

  const bannerImage = computed(() => {
    const fromBanner = firstImageUrl(bannerModule.value)
    if (fromBanner) return fromBanner
    const absorbed = pageModules.value.find((m) => isHeroAbsorbedModule(m) && !isBannerModule(m) && !isListSystemModule(m))
    return firstImageUrl(absorbed) || DEFAULT_CATALOG_BANNER
  })

  const normalModules = computed(() =>
    pageModules.value.filter((m) => !isBannerModule(m) && !isListSystemModule(m) && !isHeroAbsorbedModule(m))
  )

  const modulesBeforeList = computed(() => {
    if (listModuleIndex.value < 0) return []
    return pageModules.value
      .slice(0, listModuleIndex.value)
      .filter((m) => !isBannerModule(m) && !isListSystemModule(m) && !isHeroAbsorbedModule(m))
  })

  const modulesAfterList = computed(() => {
    if (listModuleIndex.value < 0) return normalModules.value
    return pageModules.value
      .slice(listModuleIndex.value + 1)
      .filter((m) => !isBannerModule(m) && !isListSystemModule(m) && !isHeroAbsorbedModule(m))
  })

  return {
    bannerModule,
    bannerImage,
    listModuleIndex,
    normalModules,
    modulesBeforeList,
    modulesAfterList,
    isBannerModule,
    isListSystemModule,
  }
}
