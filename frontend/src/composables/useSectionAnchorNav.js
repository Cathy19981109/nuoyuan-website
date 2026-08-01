import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'

/**
 * Sticky section tabs + scroll-spy shared by 新闻动态 / 应用领域.
 */
export function useSectionAnchorNav(articleSections, options = {}) {
  const {
    idPrefix = 'section-module',
    visibleTabsDesktop = 4,
    visibleTabsMobile = 2,
    mobileBreakpoint = 768,
  } = options

  const activeSectionId = ref(null)
  const articlesTopRef = ref(null)
  const navRef = ref(null)
  const tabsTrackRef = ref(null)
  const canScrollLeft = ref(false)
  const canScrollRight = ref(false)
  const tabsViewportWidth = ref(null)
  const visibleTabs = ref(visibleTabsDesktop)

  let ignoreScrollSpyUntil = 0
  let scrollSpyRaf = 0

  const showNavArrows = computed(() => articleSections.value.length > visibleTabs.value)

  function resolveVisibleTabs() {
    if (typeof window === 'undefined') return visibleTabsDesktop
    return window.innerWidth <= mobileBreakpoint ? visibleTabsMobile : visibleTabsDesktop
  }

  function sectionDomId(row) {
    return `${idPrefix}-${row.id}`
  }

  /** 以吸顶导航底边为探测线（兼容 html zoom） */
  function activationLine() {
    if (navRef.value) {
      return navRef.value.getBoundingClientRect().bottom + 10
    }
    const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-height')) || 72
    return header + 66
  }

  function lockScrollSpy(ms = 1000) {
    ignoreScrollSpyUntil = Date.now() + ms
  }

  function scrollElementToLine(el) {
    if (!el) return
    const delta = el.getBoundingClientRect().top - activationLine()
    window.scrollBy({ top: delta, behavior: 'smooth' })
  }

  function updateTabsScrollState() {
    const el = tabsTrackRef.value
    if (!el) {
      canScrollLeft.value = false
      canScrollRight.value = false
      return
    }
    const max = el.scrollWidth - el.clientWidth
    canScrollLeft.value = el.scrollLeft > 2
    canScrollRight.value = max > 2 && el.scrollLeft < max - 2
  }

  function syncTabsViewportWidth() {
    visibleTabs.value = resolveVisibleTabs()
    const track = tabsTrackRef.value
    if (!track || !showNavArrows.value) {
      tabsViewportWidth.value = null
      updateTabsScrollState()
      return
    }
    const tabs = [...track.querySelectorAll('.tab')]
    const count = visibleTabs.value
    if (tabs.length <= count) {
      tabsViewportWidth.value = null
      updateTabsScrollState()
      return
    }
    const gap = 10
    let width = 0
    for (let i = 0; i < count; i += 1) {
      width += tabs[i].offsetWidth
      if (i < count - 1) width += gap
    }

    // 预留左右箭头空间，避免按键被挤出屏幕
    const wrap = track.parentElement
    if (wrap) {
      const arrows = [...wrap.querySelectorAll('.nav-arrow')]
      const arrowSpace = arrows.reduce((sum, btn) => sum + btn.offsetWidth, 0)
      const gapSpace = 6 * Math.max(1, arrows.length + 1)
      const available = wrap.clientWidth - arrowSpace - gapSpace
      if (available > 80) width = Math.min(width, available)
    }

    tabsViewportWidth.value = Math.max(Math.round(width), 100)
    updateTabsScrollState()
  }

  function ensureTabFullyVisible(tabId) {
    const track = tabsTrackRef.value
    const btn = track?.querySelector(`[data-tab-id="${tabId}"]`)
    if (!track || !btn) return
    const trackRect = track.getBoundingClientRect()
    const btnRect = btn.getBoundingClientRect()
    const pad = 6
    if (btnRect.left < trackRect.left + pad) {
      track.scrollLeft -= trackRect.left - btnRect.left + pad
    } else if (btnRect.right > trackRect.right - pad) {
      track.scrollLeft += btnRect.right - trackRect.right + pad
    }
    updateTabsScrollState()
  }

  function ensureTabTrackReset() {
    const track = tabsTrackRef.value
    if (!track) return
    track.scrollTo({ left: 0, behavior: 'smooth' })
    updateTabsScrollState()
  }

  function scrollTabs(direction) {
    const el = tabsTrackRef.value
    if (!el) return
    const step = tabsViewportWidth.value || Math.max(120, Math.floor(el.clientWidth * 0.85))
    el.scrollBy({ left: direction * step, behavior: 'smooth' })
    window.setTimeout(updateTabsScrollState, 280)
  }

  function setActiveSection(id) {
    if (activeSectionId.value === id) return
    activeSectionId.value = id
    if (id != null) ensureTabFullyVisible(id)
    else ensureTabTrackReset()
  }

  /** 滚动位置落入哪个板块区间，则高亮对应按钮；接近页底时强制最后一项 */
  function updateActiveFromScroll() {
    if (Date.now() < ignoreScrollSpyUntil) return
    const rows = articleSections.value
    if (!rows.length) {
      setActiveSection(null)
      return
    }

    const line = activationLine()
    const viewportBottom = window.innerHeight
    const pageRemain =
      document.documentElement.scrollHeight - (window.scrollY + window.innerHeight)

    if (pageRemain < 100) {
      setActiveSection(rows[rows.length - 1].id)
      return
    }

    const firstEl = document.getElementById(sectionDomId(rows[0]))
    if (firstEl && firstEl.getBoundingClientRect().top > line + 24) {
      setActiveSection(null)
      return
    }

    let current = null
    for (const row of rows) {
      const el = document.getElementById(sectionDomId(row))
      if (!el) continue
      // 顶边越过吸顶导航底边 → 取最后一个满足条件的板块
      if (el.getBoundingClientRect().top <= line) current = row.id
    }

    // 下一节标题已进入视口上半区时提前切换，避免仍停在上一节
    if (current != null) {
      const idx = rows.findIndex((r) => r.id === current)
      if (idx >= 0 && idx < rows.length - 1) {
        const nextEl = document.getElementById(sectionDomId(rows[idx + 1]))
        if (nextEl && nextEl.getBoundingClientRect().top <= viewportBottom * 0.42) {
          current = rows[idx + 1].id
        }
      }
    } else {
      // 首节尚未越过探测线，但已进入视口上半区
      const first = document.getElementById(sectionDomId(rows[0]))
      if (first && first.getBoundingClientRect().top <= viewportBottom * 0.42) {
        current = rows[0].id
      }
    }

    setActiveSection(current)
  }

  function scrollToAll() {
    setActiveSection(null)
    lockScrollSpy()
    scrollElementToLine(articlesTopRef.value)
  }

  function scrollToSection(row) {
    setActiveSection(row.id)
    lockScrollSpy()
    const el = document.getElementById(sectionDomId(row))
    scrollElementToLine(el)
    nextTick(() => ensureTabFullyVisible(row.id))
  }

  function onWindowScroll() {
    if (scrollSpyRaf) return
    scrollSpyRaf = window.requestAnimationFrame(() => {
      scrollSpyRaf = 0
      updateActiveFromScroll()
    })
  }

  function onResize() {
    syncTabsViewportWidth()
    updateActiveFromScroll()
  }

  function bind() {
    nextTick(async () => {
      syncTabsViewportWidth()
      // 箭头渲染后需再量一次，避免左右键被挤出视口
      await nextTick()
      syncTabsViewportWidth()
      updateActiveFromScroll()
      tabsTrackRef.value?.addEventListener('scroll', updateTabsScrollState, { passive: true })
    })
    window.addEventListener('scroll', onWindowScroll, { passive: true })
    window.addEventListener('resize', onResize)
  }

  function unbind() {
    window.removeEventListener('scroll', onWindowScroll)
    window.removeEventListener('resize', onResize)
    tabsTrackRef.value?.removeEventListener('scroll', updateTabsScrollState)
    if (scrollSpyRaf) window.cancelAnimationFrame(scrollSpyRaf)
  }

  watch(articleSections, async () => {
    await nextTick()
    syncTabsViewportWidth()
    await nextTick()
    syncTabsViewportWidth()
    updateActiveFromScroll()
  })

  onMounted(bind)
  onBeforeUnmount(unbind)

  return {
    activeSectionId,
    articlesTopRef,
    navRef,
    tabsTrackRef,
    canScrollLeft,
    canScrollRight,
    tabsViewportWidth,
    showNavArrows,
    visibleTabs,
    sectionDomId,
    scrollToAll,
    scrollToSection,
    scrollTabs,
    syncTabsViewportWidth,
    updateActiveFromScroll,
  }
}
