<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

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
const megaTopId = ref(null)
const megaChildId = ref(null)

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
    return props.navList.map((item) => ({
      ...item,
      path: item.link_url || navRouteMap[item.name] || '/',
      children: item.children || [],
    }))
  }
  return Object.entries(navRouteMap).map(([name, path], index) => ({
    id: index,
    name,
    path,
  }))
})

const productNavNode = computed(() => menuItems.value.find((item) => item.name === '产品中心') || null)
const megaTopList = computed(() => productNavNode.value?.children || [])
const activeMegaTop = computed(() => megaTopList.value.find((row) => row.id === megaTopId.value) || megaTopList.value[0] || null)
const activeMegaChildren = computed(() => activeMegaTop.value?.children || [])
const activeMegaChild = computed(() => activeMegaChildren.value.find((row) => row.id === megaChildId.value) || activeMegaChildren.value[0] || null)
const hasThirdLevel = computed(() => megaTopList.value.some((row) => Array.isArray(row.children) && row.children.length > 0))
const megaColumnCount = computed(() => (hasThirdLevel.value ? 2 : 1))

function isActive(path) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

function goSearch() {
  const kw = searchKeyword.value.trim()
  if (!kw) return
  showSearch.value = false
  mobileMenuOpen.value = false
  router.push({ name: 'Products', query: { keyword: kw } })
}

function handleConsult() {
  const url = props.siteConfig.online_consult_url
  if (url) {
    window.open(url, '_blank')
  } else {
    router.push('/contact')
  }
}

function onMegaTopHover(id) {
  megaTopId.value = id
  const top = megaTopList.value.find((row) => row.id === id)
  megaChildId.value = top?.children?.[0]?.id || null
}

function onMegaChildHover(id) {
  megaChildId.value = id
}

function navNodePath(node, fallback = '/products') {
  const url = String(node?.link_url || '').trim()
  if (url) return url
  if (node?.id) {
    return `/products?categoryIds=${node.id}`
  }
  return fallback
}

onMounted(() => {
  if (megaTopList.value.length) {
    megaTopId.value = megaTopList.value[0].id
    megaChildId.value = megaTopList.value[0].children?.[0]?.id || null
  }
})

function ensureMegaInit() {
  if (!megaTopId.value && megaTopList.value.length) {
    megaTopId.value = megaTopList.value[0].id
    megaChildId.value = megaTopList.value[0].children?.[0]?.id || null
  }
}
</script>

<template>
  <header class="header">
    <div class="container header-inner">
      <router-link to="/" class="logo" @click="mobileMenuOpen = false">
        <div class="logo-icon">
          <img v-if="siteConfig.brand_logo || siteConfig.site_logo" :src="siteConfig.brand_logo || siteConfig.site_logo" alt="logo" />
          <svg v-else viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="20" r="18" stroke="currentColor" stroke-width="2" />
            <path d="M12 20h16M20 12v16" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            <circle cx="20" cy="20" r="4" fill="currentColor" />
          </svg>
        </div>
        <div class="logo-text">
          <span class="logo-cn">{{ (siteConfig.brand_title || '诺元智合').slice(0, 8) }}</span>
          <span class="logo-en">NUOYUAN BIOTECH</span>
        </div>
      </router-link>

      <nav class="nav" :class="{ open: mobileMenuOpen }">
        <div v-for="item in menuItems" :key="item.id" class="nav-group">
          <router-link
            :to="item.path"
            class="nav-item"
            :class="{ active: isActive(item.path) }"
            @click="mobileMenuOpen = false"
          >
            {{ String(item.name || '').slice(0, 4) }}
          </router-link>
          <div
            v-if="item.name === '产品中心' && megaTopList.length"
            class="dropdown mega-dropdown"
            :class="`mega-cols-${megaColumnCount}`"
            @mouseenter="ensureMegaInit"
          >
            <div class="mega-col">
              <div
                v-for="row in megaTopList"
                :key="row.id"
                class="mega-row"
                :class="{ active: activeMegaTop?.id === row.id }"
                @mouseenter="onMegaTopHover(row.id)"
              >
                <router-link :to="navNodePath(row, '/products')">{{ row.name }}</router-link>
                <span class="arrow">›</span>
              </div>
            </div>
            <div v-if="hasThirdLevel" class="mega-col">
              <div
                v-for="row in activeMegaChildren"
                :key="row.id"
                class="mega-row"
                :class="{ active: activeMegaChild?.id === row.id }"
                @mouseenter="onMegaChildHover(row.id)"
              >
                <router-link :to="navNodePath(row, '/products')">{{ row.name }}</router-link>
              </div>
            </div>
          </div>
          <div v-else-if="item.children?.length" class="dropdown">
            <div v-if="item.dropdown_banner" class="dropdown-banner">
              <img :src="item.dropdown_banner" :alt="item.name" />
            </div>
            <router-link
              v-for="child in item.children"
              :key="child.id"
              :to="child.link_url || '#'"
              class="dropdown-item"
            >
              {{ String(child.name || '').slice(0, 8) }}
            </router-link>
          </div>
        </div>
      </nav>

      <div class="actions">
        <button class="icon-btn" title="搜索" @click="showSearch = !showSearch">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
        </button>
        <button class="btn btn-outline consult-btn" @click="handleConsult">在线咨询</button>
        <button class="btn btn-primary" @click="emit('open-inquiry')">立即询价</button>
        <button class="menu-toggle" @click="mobileMenuOpen = !mobileMenuOpen">
          <span /><span /><span />
        </button>
      </div>
    </div>

    <div v-if="showSearch" class="search-bar">
      <div class="container search-inner">
        <input
          v-model="searchKeyword"
          type="text"
          placeholder="搜索产品、新闻..."
          @keyup.enter="goSearch"
        />
        <button class="btn btn-primary" @click="goSearch">搜索</button>
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
}

.logo-icon {
  width: 40px;
  height: 40px;
  color: var(--color-accent);
  overflow: hidden;
  border-radius: 8px;
}
.logo-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.logo-cn {
  display: block;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.2;
}

.logo-en {
  display: block;
  font-size: 10px;
  opacity: 0.75;
  letter-spacing: 1px;
}

.nav {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
  justify-content: center;
}

.nav-group {
  position: relative;
}

.nav-item {
  padding: 8px 14px;
  color: rgba(255, 255, 255, 0.85);
  font-size: 14px;
  border-radius: 4px;
  transition: all 0.2s;
  white-space: nowrap;
}

.dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  min-width: 220px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
  padding: 10px;
  display: none;
  z-index: 20;
}
.nav-group:hover .dropdown {
  display: block;
}
.dropdown-banner {
  margin-bottom: 8px;
  border-radius: 6px;
  overflow: hidden;
}
.dropdown-banner img {
  width: 100%;
  height: 68px;
  object-fit: cover;
}
.dropdown-item {
  display: block;
  padding: 8px 10px;
  border-radius: 6px;
  color: #1f2937;
  font-size: 13px;
}
.dropdown-item:hover {
  background: #f3f4f6;
}
.mega-dropdown {
  width: 520px;
  display: none;
  grid-template-columns: 220px 300px;
  gap: 0;
  padding: 0;
  overflow: hidden;
}
.mega-dropdown.mega-cols-1 {
  width: 260px;
  grid-template-columns: 1fr;
}
.mega-dropdown.mega-cols-2 {
  width: 520px;
  grid-template-columns: 220px 300px;
}
.nav-group:hover .mega-dropdown {
  display: grid;
}
.mega-col {
  min-height: 220px;
  max-height: 220px;
  overflow-y: auto;
  border-right: 1px solid #e5e7eb;
  background: #fff;
  padding: 10px 0;
}
.mega-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 9px 14px;
  font-size: 13px;
  color: #1f2937;
  cursor: pointer;
}
.mega-row:hover,
.mega-row.active {
  background: #f3f4f6;
  color: #111827;
}
.mega-row a {
  color: inherit;
  width: 100%;
}
.mega-row .arrow {
  color: #9ca3af;
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

.consult-btn {
  padding: 8px 14px;
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
  padding: 12px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
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

@media (max-width: 1024px) {
  .consult-btn {
    display: none;
  }

  .nav-item {
    padding: 8px 10px;
    font-size: 13px;
  }
}

@media (max-width: 768px) {
  .nav {
    display: none;
    position: absolute;
    top: var(--header-height);
    left: 0;
    right: 0;
    flex-direction: column;
    background: var(--color-primary);
    padding: 12px;
    box-shadow: var(--shadow-md);
  }
  .dropdown { display: none !important; }

  .nav.open {
    display: flex;
  }

  .nav-item {
    width: 100%;
    text-align: center;
    padding: 12px;
  }

  .menu-toggle {
    display: flex;
  }
}
</style>
