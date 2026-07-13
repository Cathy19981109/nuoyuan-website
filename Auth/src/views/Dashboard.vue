<template>
  <div>
    <div class="page-header">
      <div>
        <h2>控制台</h2>
        <p class="desc">欢迎回来，{{ auth.admin?.real_name || auth.admin?.username }}</p>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card" v-for="item in stats" :key="item.label">
        <div class="stat-icon">{{ item.icon }}</div>
        <div>
          <div class="stat-value">{{ item.value }}</div>
          <div class="stat-label">{{ item.label }}</div>
        </div>
      </div>
    </div>

    <div class="card" style="margin-top: 20px">
      <h3 class="section-title">快捷入口</h3>
      <div class="quick-links">
        <router-link v-for="link in quickLinks" :key="link.path" :to="link.path" class="quick-link">
          <span>{{ link.icon }}</span>
          <span>{{ link.label }}</span>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { getProductList, getNewsList, getInquiryList, getNavList } from '@/api'

const auth = useAuthStore()

const stats = ref([
  { label: '导航菜单', value: '-', icon: '🧭' },
  { label: '产品数量', value: '-', icon: '🧬' },
  { label: '新闻数量', value: '-', icon: '📰' },
  { label: '待处理询价', value: '-', icon: '💬' },
])

const quickLinks = [
  { path: '/nav', label: '导航管理', icon: '🧭' },
  { path: '/products', label: '产品管理', icon: '🧬' },
  { path: '/news', label: '新闻管理', icon: '📰' },
  { path: '/inquiries', label: '询价管理', icon: '💬' },
  { path: '/config', label: '系统配置', icon: '⚙️' },
]

function countNav(items) {
  let count = 0
  function walk(list) {
    list.forEach((item) => {
      count++
      if (item.children?.length) walk(item.children)
    })
  }
  walk(items)
  return count
}

onMounted(async () => {
  try {
    const [nav, products, news, inquiries] = await Promise.all([
      getNavList(),
      getProductList({ page: 1, pageSize: 1 }),
      getNewsList({ page: 1, pageSize: 1 }),
      getInquiryList({ status: 0, page: 1, pageSize: 1 }),
    ])
    stats.value[0].value = countNav(nav)
    stats.value[1].value = products.pagination?.total ?? 0
    stats.value[2].value = news.pagination?.total ?? 0
    stats.value[3].value = inquiries.pagination?.total ?? 0
  } catch {
    // ignore dashboard stat errors
  }
})
</script>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}
.stat-card {
  background: var(--color-white);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
}
.stat-icon { font-size: 28px; }
.stat-value { font-size: 28px; font-weight: 700; color: var(--color-primary); }
.stat-label { font-size: 13px; color: var(--color-text-light); margin-top: 2px; }
.section-title { font-size: 15px; font-weight: 600; margin-bottom: 16px; color: var(--color-primary); }
.quick-links { display: flex; flex-wrap: wrap; gap: 12px; }
.quick-link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 18px;
  background: var(--color-bg);
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s;
}
.quick-link:hover { background: #e2e8f0; color: var(--color-primary); }
</style>
