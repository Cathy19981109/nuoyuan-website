<template>
  <div class="admin-layout">
    <aside class="sidebar">
      <div class="sidebar-brand">
        <span class="brand-icon">N</span>
        <div>
          <div class="brand-title">诺元智合</div>
          <div class="brand-sub">管理后台</div>
        </div>
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
              <span>{{ item.label }}</span>
              <span v-if="item.children?.length" class="arrow">{{ expanded[item.key] ? '▾' : '▸' }}</span>
            </button>
            <div v-if="item.children?.length && expanded[item.key]" class="sub-list">
              <router-link
                v-for="child in item.children"
                :key="child.path"
                :to="child.path"
                class="nav-item sub-item"
                :class="{ active: isActive(child.path) }"
              >
                <span>{{ child.label }}</span>
              </router-link>
            </div>
          </div>
        </div>
      </nav>
    </aside>

    <div class="main-area">
      <header class="topbar">
        <div class="topbar-title">{{ currentTitle }}</div>
        <div class="topbar-right">
          <span class="admin-name">{{ auth.admin?.real_name || auth.admin?.username }}</span>
          <button class="btn btn-secondary btn-sm" @click="handleLogout">退出登录</button>
        </div>
      </header>
      <main class="content">
        <AppBreadcrumb />
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AppBreadcrumb from '@/components/AppBreadcrumb.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const menuItems = [
  { key: 'site', path: '/site-center', label: '官网信息', icon: '⌂' },
  { key: 'stats', path: '/stats-board', label: '数据统计', icon: '◫' },
  { key: 'nav-page', label: '导航&页面管理', icon: '◨', children: [
    { path: '/nav', label: '导航编辑' },
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

function isActive(path) {
  return route.path === path || route.path.startsWith(path + '/')
}

function isMenuActive(item) {
  if (item.path && isActive(item.path)) return true
  return item.children?.some((c) => isActive(c.path))
}

function onMenuClick(item) {
  if (item.children?.length) {
    expanded.value[item.key] = !expanded.value[item.key]
    return
  }
  if (item.path) router.push(item.path)
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
}

.brand-title { font-size: 16px; font-weight: 600; }
.brand-sub { font-size: 12px; opacity: 0.7; margin-top: 2px; }

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
  color: #cbd5e1;
  transition: all 0.2s;
  font-size: 14px;
}
.nav-item:hover { background: rgba(255, 255, 255, 0.12); color: #f8fafc; }
.nav-item.active { background: #2563eb; color: #fff; font-weight: 500; }
.nav-icon { font-size: 14px; width: 18px; text-align: center; }
.arrow { margin-left: auto; opacity: 0.8; }

.main-area {
  flex: 1;
  margin-left: var(--sidebar-width);
  display: flex;
  flex-direction: column;
  min-height: 100vh;
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
}

.topbar-title { font-size: 16px; font-weight: 600; color: var(--color-primary); }
.topbar-right { display: flex; align-items: center; gap: 12px; }
.admin-name { font-size: 13px; color: var(--color-text-light); }

.content {
  flex: 1;
  padding: 24px;
}

@media (max-width: 768px) {
  .sidebar { width: 64px; }
  .sidebar-brand div, .nav-item span:not(.nav-icon) { display: none; }
  .sidebar-brand { justify-content: center; padding: 16px 8px; }
  .nav-item { justify-content: center; padding: 12px 8px; }
  .main-area { margin-left: 64px; }
}
</style>
