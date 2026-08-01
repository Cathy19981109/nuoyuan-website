<template>
  <div class="admin-layout" :class="{ 'sidebar-open': mobileNavOpen }">
    <div
      v-if="mobileNavOpen"
      class="sidebar-backdrop"
      @click="mobileNavOpen = false"
    />

    <aside class="sidebar">
      <div class="sidebar-brand" :class="{ 'has-logo': !!brandLogoUrl }">
        <img
          v-if="brandLogoUrl"
          class="brand-logo"
          :src="brandLogoUrl"
          alt="品牌 Logo"
        />
        <template v-else>
          <span class="brand-icon">N</span>
          <div class="brand-text">
            <div class="brand-title">诺元智合</div>
          </div>
        </template>
      </div>
      <nav class="sidebar-nav">
        <div class="nav-tree">
          <div v-for="item in menuItems" :key="item.key">
            <button
              type="button"
              class="nav-item nav-btn"
              :class="{ active: isMenuActive(item) }"
              @click="onMenuClick(item)"
            >
              <span class="nav-icon">{{ item.icon }}</span>
              <span class="nav-label">{{ item.label }}</span>
              <span v-if="item.children?.length" class="arrow">{{ expanded[item.key] ? '▾' : '▸' }}</span>
            </button>
            <div v-if="item.children?.length && expanded[item.key]" class="sub-list">
              <router-link
                v-for="child in item.children"
                :key="child.path"
                :to="child.path"
                class="nav-item sub-item"
                :class="{ active: isActive(child.path) }"
                @click="closeMobileNav"
              >
                <span class="nav-label">{{ child.label }}</span>
              </router-link>
            </div>
          </div>
        </div>
      </nav>
    </aside>

    <div class="main-area">
      <header class="topbar">
        <div class="topbar-left">
          <button
            type="button"
            class="menu-toggle"
            aria-label="打开导航菜单"
            @click="mobileNavOpen = !mobileNavOpen"
          >
            <span /><span /><span />
          </button>
          <div class="topbar-title">{{ currentTitle }}</div>
        </div>
        <div class="topbar-right">
          <span class="admin-name">{{ auth.admin?.real_name || auth.admin?.username }}</span>
          <button class="btn btn-secondary btn-sm" @click="handleLogout">退出登录</button>
        </div>
      </header>
      <div class="breadcrumb-bar">
        <AppBreadcrumb />
      </div>
      <main class="content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getSiteCenter } from '@/api'
import { toPublicMediaUrl } from '@/utils/media'
import { applyFavicon } from '@/utils/favicon'
import AppBreadcrumb from '@/components/AppBreadcrumb.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const brandLogo = ref('')
const iconLogo = ref('')
const mobileNavOpen = ref(false)

const brandLogoUrl = computed(() => toPublicMediaUrl(brandLogo.value))

const menuItems = [
  { key: 'site', path: '/site-center', label: '官网信息', icon: '⌂' },
  { key: 'stats', path: '/stats-board', label: '数据统计', icon: '◫' },
  { key: 'nav-page', label: '导航&页面管理', icon: '◨', children: [
    { path: '/nav', label: '顶部导航编辑' },
    { path: '/footer-config', label: '底部导航编辑' },
    { path: '/page-editor', label: '页面编辑' },
  ] },
  { key: 'product', label: '产品管理', icon: '◧', children: [
    { path: '/product-filter-tags', label: '筛选标签' },
    { path: '/products', label: '产品列表' },
  ] },
  { key: 'service', label: '服务管理', icon: '◧', children: [
    { path: '/service-filter-tags', label: '筛选标签' },
    { path: '/services-admin', label: '服务列表' },
  ] },
  { key: 'inquiry', path: '/inquiries', label: '询价管理', icon: '◪' },
  { key: 'permission', path: '/permission-manager', label: '权限管理', icon: '◎' },
  { key: 'seo', path: '/seo-manager', label: 'SEO管理', icon: '◰' },
]
const expanded = ref({})

const currentTitle = computed(() => route.meta.title || '管理后台')

watch(() => route.fullPath, () => {
  mobileNavOpen.value = false
})

onMounted(async () => {
  try {
    const groups = await getSiteCenter()
    const items = (groups || []).flatMap((g) => g.items || [])
    const logoItem = items.find((i) => i.key === 'brand_logo')
    const iconItem = items.find((i) => i.key === 'icon_logo')
    brandLogo.value = String(logoItem?.value || '').trim()
    iconLogo.value = String(iconItem?.value || '').trim()
    applyFavicon(toPublicMediaUrl(iconLogo.value) || '/favicon.png')
  } catch {
    brandLogo.value = ''
    iconLogo.value = ''
    applyFavicon('/favicon.png')
  }
})

function isActive(path) {
  return route.path === path || route.path.startsWith(path + '/')
}

function isMenuActive(item) {
  if (item.path && isActive(item.path)) return true
  return item.children?.some((c) => isActive(c.path))
}

function closeMobileNav() {
  mobileNavOpen.value = false
}

function onMenuClick(item) {
  if (item.children?.length) {
    expanded.value[item.key] = !expanded.value[item.key]
    return
  }
  if (item.path) {
    router.push(item.path)
    closeMobileNav()
  }
}

function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
}

.sidebar-backdrop {
  display: none;
}

.sidebar {
  width: var(--sidebar-width);
  background: var(--color-primary);
  color: var(--color-white);
  flex-shrink: 0;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  overflow-y: auto;
  z-index: 100;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.sidebar-brand.has-logo {
  flex-direction: column;
  align-items: flex-start;
  gap: 0;
}

.brand-logo {
  display: block;
  height: 56px;
  width: auto;
  max-width: 100%;
  object-fit: contain;
  object-position: left center;
}

.brand-icon {
  width: 36px;
  height: 36px;
  background: var(--color-accent);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 18px;
  flex-shrink: 0;
}

.brand-title { font-size: 16px; font-weight: 600; }

.sidebar-nav { padding: 12px 10px; }
.nav-tree { display: grid; gap: 4px; }
.sub-list { margin: 2px 0 8px; display: grid; gap: 2px; }
.nav-btn { width: 100%; border: none; background: transparent; text-align: left; cursor: pointer; }
.sub-item {
  padding-left: 34px;
  font-size: 13px;
  color: #cbd5e1;
}
.sub-item::before {
  content: '•';
  margin-right: 8px;
  font-size: 11px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 6px;
  margin-bottom: 2px;
  color: #e2e8f0;
  transition: all 0.2s;
  font-size: 14px;
}
.nav-label {
  flex: 1;
  min-width: 0;
  line-height: 1.35;
  word-break: break-word;
}
.nav-item:hover { background: rgba(255, 255, 255, 0.12); color: #f8fafc; }
.nav-item.active { background: #2563eb; color: #fff; font-weight: 600; }
.nav-icon { font-size: 14px; width: 18px; text-align: center; flex-shrink: 0; }
.arrow { margin-left: auto; opacity: 0.8; flex-shrink: 0; }

.main-area {
  flex: 1;
  margin-left: var(--sidebar-width);
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  min-width: 0;
}

.topbar {
  height: var(--header-height);
  background: var(--color-white);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  position: sticky;
  top: 0;
  z-index: 50;
  gap: 12px;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.menu-toggle {
  display: none;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  width: 42px;
  height: 42px;
  padding: 8px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  flex-shrink: 0;
}

.menu-toggle span {
  display: block;
  width: 100%;
  height: 2px;
  background: var(--color-primary);
  border-radius: 2px;
}

.topbar-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.topbar-right { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
.admin-name { font-size: 13px; color: var(--color-text-light); }

.breadcrumb-bar {
  position: sticky;
  top: var(--header-height);
  z-index: 45;
  height: var(--breadcrumb-height);
  display: flex;
  align-items: center;
  padding: 0 24px;
  background: var(--color-bg);
  border-bottom: 1px solid var(--color-border);
  box-shadow: 0 6px 12px -10px rgba(15, 23, 42, 0.35);
}

.content {
  flex: 1;
  padding: 24px;
}

@media (max-width: 768px) {
  .sidebar-backdrop {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 90;
    background: rgba(15, 23, 42, 0.45);
  }

  .sidebar {
    width: min(82vw, 300px);
    transform: translateX(-105%);
    transition: transform 0.22s ease;
    box-shadow: 8px 0 24px rgba(15, 23, 42, 0.2);
  }

  .admin-layout.sidebar-open .sidebar {
    transform: translateX(0);
  }

  .sidebar-brand {
    padding: 18px 16px;
  }

  .brand-logo {
    height: 44px;
    max-width: 100%;
  }

  .brand-title {
    font-size: 18px;
  }

  .sidebar-nav {
    padding: 14px 12px 24px;
  }

  .nav-item {
    gap: 12px;
    padding: 14px 14px;
    margin-bottom: 4px;
    font-size: 17px;
    font-weight: 500;
    color: #f8fafc;
    min-height: 48px;
  }

  .nav-label {
    display: block !important;
    font-size: 17px;
    line-height: 1.4;
  }

  .nav-icon {
    width: 22px;
    font-size: 18px;
  }

  .sub-item {
    padding-left: 40px;
    font-size: 16px;
    min-height: 44px;
    color: #e2e8f0;
  }

  .sub-item .nav-label {
    font-size: 16px;
  }

  .arrow {
    font-size: 16px;
  }

  .main-area {
    margin-left: 0;
  }

  .menu-toggle {
    display: flex;
  }

  .topbar {
    padding: 0 12px;
  }

  .topbar-title {
    font-size: 16px;
  }

  .admin-name {
    display: none;
  }

  .breadcrumb-bar {
    padding: 0 12px;
  }

  .content {
    padding: 16px 12px;
  }
}

@media (max-width: 430px) {
  .sidebar {
    width: min(88vw, 320px);
  }

  .nav-item {
    font-size: 18px;
    padding: 15px 14px;
  }

  .nav-label {
    font-size: 18px;
  }

  .sub-item,
  .sub-item .nav-label {
    font-size: 16px;
  }
}
</style>
