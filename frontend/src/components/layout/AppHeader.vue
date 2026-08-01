<script setup>
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { searchSite } from '@/api'
import { toPublicMediaUrl } from '@/utils/media'

const props = defineProps({
  navList: { type: Array, default: () => [] },
  siteConfig: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['open-inquiry'])

const route = useRoute()
const router = useRouter()
const searchKeyword = ref('')
const showSearch = ref(false)
const mobileMenuOpen = ref(false)
const searchInputRef = ref(null)
const suggestions = ref([])
const searchLoading = ref(false)
const showSuggestions = ref(false)
let searchTimer = null
let searchSeq = 0

const brandLogoSrc = computed(() =>
  toPublicMediaUrl(props.siteConfig.brand_logo || props.siteConfig.site_logo || '')
)

const navRouteMap = {
  首页: '/',
  产品中心: '/products',
  技术服务: '/services',
  应用领域: '/applications',
  新闻动态: '/news',
  关于我们: '/about',
  联系我们: '/contact',
}

const menuItems = computed(() => {
  if (props.navList.length) {
    return props.navList
      .filter((item) => !item.parent_id || Number(item.parent_id) === 0)
      .map((item) => {
        const path = resolveNavPath(item)
        return {
          ...item,
          path,
          external: isExternalUrl(path) || String(item.target || '') === '_blank',
        }
      })
  }
  return Object.entries(navRouteMap).map(([name, path], index) => ({
    id: index,
    name,
    path,
    external: false,
  }))
})

function isExternalUrl(url) {
  return /^https?:\/\//i.test(String(url || '').trim())
}

function resolveNavPath(item) {
  const link = String(item?.link_url || '').trim()
  if (link) return link
  const pageKey = String(item?.page_nav_name || '').trim()
  if (pageKey) return pageKey === 'home' ? '/' : `/${pageKey}`
  if (navRouteMap[item?.name]) return navRouteMap[item.name]
  return '/'
}

const groupedSuggestions = computed(() => {
  const groups = []
  const order = ['product', 'service']
  const labelMap = {
    product: '产品',
    service: '服务',
  }
  order.forEach((type) => {
    const items = suggestions.value.filter((s) => s.type === type)
    if (items.length) {
      groups.push({ type, label: labelMap[type] || type, items })
    }
  })
  return groups
})

function isActive(path) {
  if (!path || isExternalUrl(path)) return false
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

const currentNavLabel = computed(() => {
  const hit = menuItems.value.find((item) => isActive(item.path))
  if (hit?.name) return String(hit.name).slice(0, 4)
  if (route.path.startsWith('/products')) return '产品中心'
  if (route.path.startsWith('/services')) return '技术服务'
  if (route.path.startsWith('/applications')) return '应用领域'
  if (route.path.startsWith('/news')) return '新闻动态'
  if (route.path.startsWith('/about')) return '关于我们'
  if (route.path.startsWith('/contact')) return '联系我们'
  if (route.path === '/' || route.path === '') return '首页'
  return ''
})

async function toggleSearch() {
  showSearch.value = !showSearch.value
  mobileMenuOpen.value = false
  if (showSearch.value) {
    await nextTick()
    searchInputRef.value?.focus?.()
    if (searchKeyword.value.trim()) runSearch(searchKeyword.value)
  } else {
    showSuggestions.value = false
  }
}

function clearSearchTimer() {
  if (searchTimer) {
    clearTimeout(searchTimer)
    searchTimer = null
  }
}

async function runSearch(raw) {
  const kw = String(raw || '').trim()
  if (!kw) {
    suggestions.value = []
    showSuggestions.value = false
    searchLoading.value = false
    return
  }
  const seq = ++searchSeq
  searchLoading.value = true
  try {
    const data = await searchSite(kw, { pageSize: 8 })
    if (seq !== searchSeq) return
    suggestions.value = Array.isArray(data?.suggestions) ? data.suggestions : []
    showSuggestions.value = true
  } catch {
    if (seq !== searchSeq) return
    suggestions.value = []
    showSuggestions.value = true
  } finally {
    if (seq === searchSeq) searchLoading.value = false
  }
}

function onSearchInput() {
  clearSearchTimer()
  const kw = searchKeyword.value.trim()
  if (!kw) {
    suggestions.value = []
    showSuggestions.value = false
    searchLoading.value = false
    return
  }
  showSuggestions.value = true
  searchTimer = setTimeout(() => runSearch(kw), 220)
}

function goSearch() {
  const kw = searchKeyword.value.trim()
  if (!kw) return
  clearSearchTimer()
  showSuggestions.value = false
  showSearch.value = false
  mobileMenuOpen.value = false
  router.push({ name: 'Search', query: { keyword: kw } })
}

function goSuggestion(item) {
  if (!item?.to) return
  clearSearchTimer()
  showSuggestions.value = false
  showSearch.value = false
  mobileMenuOpen.value = false
  router.push(item.to)
}

function openInquiry() {
  emit('open-inquiry')
}

watch(showSearch, (on) => {
  if (!on) {
    clearSearchTimer()
    showSuggestions.value = false
  }
})

onBeforeUnmount(() => {
  clearSearchTimer()
})
</script>

<template>
  <header class="header">
    <div class="container header-inner">
      <router-link to="/" class="logo" @click="mobileMenuOpen = false">
        <img
          v-if="brandLogoSrc"
          class="logo-img"
          :src="brandLogoSrc"
          alt="品牌 Logo"
        />
        <div v-else class="logo-fallback">
          <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="20" r="18" stroke="currentColor" stroke-width="2" />
            <path d="M12 20h16M20 12v16" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            <circle cx="20" cy="20" r="4" fill="currentColor" />
          </svg>
          <span>诺元智合</span>
        </div>
      </router-link>

      <div v-if="currentNavLabel" class="mobile-page-label" aria-live="polite">
        {{ currentNavLabel }}
      </div>

      <nav class="nav" :class="{ open: mobileMenuOpen }">
        <template v-for="item in menuItems" :key="item.id">
          <a
            v-if="item.external"
            :href="item.path"
            class="nav-item"
            :class="{ active: isActive(item.path) }"
            :target="String(item.target || '_blank')"
            rel="noopener noreferrer"
            @click="mobileMenuOpen = false"
          >
            {{ String(item.name || '').slice(0, 4) }}
          </a>
          <router-link
            v-else
            :to="item.path"
            class="nav-item"
            :class="{ active: isActive(item.path) }"
            @click="mobileMenuOpen = false"
          >
            {{ String(item.name || '').slice(0, 4) }}
          </router-link>
        </template>
      </nav>

      <div class="actions">
        <button class="icon-btn" title="搜索" @click="toggleSearch">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
        </button>
        <button class="btn btn-primary inquiry-btn" @click="openInquiry">立即询价</button>
        <button class="menu-toggle" @click="mobileMenuOpen = !mobileMenuOpen">
          <span /><span /><span />
        </button>
      </div>
    </div>

    <div v-if="showSearch" class="search-bar">
      <div class="container search-panel">
        <div class="search-inner">
          <input
            ref="searchInputRef"
            v-model="searchKeyword"
            type="text"
            placeholder="搜索产品、服务..."
            @input="onSearchInput"
            @focus="onSearchInput"
            @keyup.enter="goSearch"
          />
          <button class="btn btn-primary" @click="goSearch">搜索</button>
        </div>

        <div v-if="showSuggestions" class="suggest-panel">
          <div v-if="searchLoading" class="suggest-status">正在搜索...</div>
          <template v-else-if="groupedSuggestions.length">
            <div v-for="group in groupedSuggestions" :key="group.type" class="suggest-group">
              <div class="suggest-group-title">{{ group.label }}</div>
              <button
                v-for="item in group.items"
                :key="`${item.type}-${item.id}`"
                type="button"
                class="suggest-item"
                @click="goSuggestion(item)"
              >
                <span class="suggest-title">{{ item.title }}</span>
                <span v-if="item.desc" class="suggest-desc">{{ item.desc }}</span>
              </button>
            </div>
            <button type="button" class="suggest-more" @click="goSearch">
              查看全部「{{ searchKeyword.trim() }}」相关结果
            </button>
          </template>
          <div v-else class="suggest-status">未找到相关内容，可换个关键词试试</div>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: var(--color-primary);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
}

.header-inner {
  display: flex;
  align-items: center;
  height: var(--header-height);
  gap: 24px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
  color: var(--color-white);
  min-width: 0;
}

.logo-img {
  display: block;
  height: 44px;
  width: auto;
  max-width: min(320px, 55vw);
  aspect-ratio: auto;
  object-fit: contain;
  object-position: left center;
  flex-shrink: 0;
}

.logo-fallback {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--color-white);
  font-size: 18px;
  font-weight: 700;
}

.logo-fallback svg {
  width: 36px;
  height: 36px;
  color: var(--color-accent);
}

.nav {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
  justify-content: center;
}

.nav-item {
  padding: 8px 14px;
  color: rgba(255, 255, 255, 0.85);
  font-size: 14px;
  border-radius: 4px;
  transition: all 0.2s;
  white-space: nowrap;
}

.nav-item:hover,
.nav-item.active {
  color: var(--color-white);
  background: rgba(255, 255, 255, 0.12);
}

.actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.icon-btn {
  background: transparent;
  border: none;
  color: var(--color-white);
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  display: flex;
  align-items: center;
}

.icon-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.inquiry-btn {
  padding: 8px 16px;
  font-size: 13px;
}

.actions .btn-primary {
  padding: 8px 16px;
  font-size: 13px;
}

.menu-toggle {
  display: none;
  flex-direction: column;
  gap: 5px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
}

.menu-toggle span {
  display: block;
  width: 22px;
  height: 2px;
  background: var(--color-white);
  border-radius: 2px;
}

.search-bar {
  background: var(--color-primary-dark);
  padding: 12px 0 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.search-panel {
  position: relative;
}

.search-inner {
  display: flex;
  gap: 12px;
}

.search-inner input {
  flex: 1;
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
}

.suggest-panel {
  margin-top: 8px;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.18);
  max-height: min(60vh, 420px);
  overflow: auto;
  padding: 8px 0;
}

.suggest-group + .suggest-group {
  border-top: 1px solid #eef2f7;
  margin-top: 4px;
  padding-top: 4px;
}

.suggest-group-title {
  padding: 8px 14px 4px;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  letter-spacing: 0.04em;
}

.suggest-item {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  border: none;
  background: transparent;
  text-align: left;
  padding: 10px 14px;
  cursor: pointer;
}

.suggest-item:hover {
  background: #f1f5f9;
}

.suggest-title {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
}

.suggest-desc {
  font-size: 12px;
  color: #64748b;
  line-height: 1.45;
}

.suggest-more {
  width: 100%;
  border: none;
  border-top: 1px solid #eef2f7;
  background: transparent;
  padding: 12px 14px;
  margin-top: 4px;
  text-align: left;
  color: #0b2d5c;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.suggest-more:hover {
  background: #f8fafc;
}

.suggest-status {
  padding: 16px 14px;
  font-size: 13px;
  color: #64748b;
}

@media (max-width: 1024px) {
  .nav-item {
    padding: 8px 10px;
    font-size: 13px;
  }
}

.mobile-page-label {
  display: none;
}

@media (max-width: 768px) {
  .logo-img {
    max-height: 36px;
    max-width: min(140px, 34vw);
  }

  .logo-fallback span {
    display: none;
  }

  .mobile-page-label {
    display: block;
    flex: 1;
    min-width: 0;
    color: #fff;
    font-size: 16px;
    font-weight: 700;
    letter-spacing: 0.02em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: left;
    line-height: 1.2;
  }

  .nav {
    display: none;
    position: absolute;
    top: var(--header-height);
    left: 0;
    right: 0;
    flex-direction: column;
    background: var(--color-primary);
    padding: 12px 12px calc(12px + env(safe-area-inset-bottom, 0px));
    box-shadow: var(--shadow-md);
    max-height: calc(100dvh - var(--header-height));
    overflow-y: auto;
    z-index: 40;
  }

  .nav.open {
    display: flex;
  }

  .nav-item {
    width: 100%;
    text-align: center;
    padding: 14px 12px;
    font-size: 16px;
    min-height: 48px;
  }

  .nav-item.active {
    background: rgba(255, 255, 255, 0.22);
    font-weight: 700;
  }

  .menu-toggle {
    display: flex;
    width: 44px;
    height: 44px;
    align-items: center;
    justify-content: center;
  }

  .actions {
    gap: 6px;
  }

  .inquiry-btn,
  .actions .btn-primary {
    min-height: 40px;
    font-size: 13px;
  }
}

@media (max-width: 430px) {
  .header-inner {
    gap: 8px;
  }

  .inquiry-btn,
  .actions .btn-primary {
    padding: 8px 12px;
  }

  .suggest-panel {
    left: 12px;
    right: 12px;
    width: auto;
  }
}
</style>
