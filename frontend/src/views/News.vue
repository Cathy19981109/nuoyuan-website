<script setup>
import { ref, onMounted, watch } from 'vue'
import { getNewsCategories, getNewsList, getPageModules } from '@/api'
import ModuleRenderer from '@/components/modules/ModuleRenderer.vue'
import { applySeoMeta } from '@/composables/useSeo'

const categories = ref([])
const newsList = ref([])
const activeCategory = ref(null)
const loading = ref(true)
const pagination = ref({ page: 1, pageSize: 10, totalPages: 0 })
const pageModules = ref([])

async function loadNews(page = 1) {
  loading.value = true
  try {
    const params = { page, pageSize: pagination.value.pageSize }
    if (activeCategory.value) params.categoryId = activeCategory.value
    const data = await getNewsList(params)
    newsList.value = data.list || []
    pagination.value = { ...pagination.value, ...data.pagination }
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  categories.value = await getNewsCategories()
  pageModules.value = await getPageModules('news')
  await applySeoMeta({ pageKey: 'news' })
  await loadNews()
})

watch(activeCategory, () => loadNews(1))
</script>

<template>
  <div>
    <div class="page-banner">
      <div class="container">
        <h1>新闻动态</h1>
        <p>了解最新行业资讯与公司动态</p>
      </div>
    </div>

    <section class="section">
      <div class="container">
        <div class="category-tabs">
          <button class="tab" :class="{ active: !activeCategory }" @click="activeCategory = null">全部</button>
          <button
            v-for="cat in categories"
            :key="cat.id"
            class="tab"
            :class="{ active: activeCategory === cat.id }"
            @click="activeCategory = cat.id"
          >
            {{ cat.name }}
          </button>
        </div>

        <div v-if="loading" class="loading">加载中...</div>
        <div v-else-if="newsList.length" class="news-list">
          <router-link
            v-for="item in newsList"
            :key="item.id"
            :to="`/news/${item.id}`"
            class="news-row card"
          >
            <div class="news-info">
              <span v-if="item.is_top" class="top-tag">置顶</span>
              <h3>{{ item.title }}</h3>
              <p>{{ item.short_desc }}</p>
            </div>
            <div class="news-meta">
              <span>{{ item.publish_time?.slice(0, 10) }}</span>
            </div>
          </router-link>
        </div>
        <div v-else class="empty">暂无新闻</div>

        <div v-if="pagination.totalPages > 1" class="pagination">
          <button
            :disabled="pagination.page <= 1"
            @click="loadNews(pagination.page - 1)"
          >
            上一页
          </button>
          <span>{{ pagination.page }} / {{ pagination.totalPages }}</span>
          <button
            :disabled="pagination.page >= pagination.totalPages"
            @click="loadNews(pagination.page + 1)"
          >
            下一页
          </button>
        </div>
      </div>
    </section>
    <ModuleRenderer :modules="pageModules" />
  </div>
</template>

<style scoped>
.category-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 32px;
  justify-content: center;
}

.tab {
  padding: 8px 20px;
  border: 1px solid var(--color-border);
  border-radius: 20px;
  background: var(--color-white);
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.tab.active {
  background: var(--color-primary);
  color: var(--color-white);
  border-color: var(--color-primary);
}

.news-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.news-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  gap: 24px;
}

.news-info h3 {
  font-size: 16px;
  color: var(--color-primary);
  margin-bottom: 6px;
}

.news-info p {
  font-size: 13px;
  color: var(--color-text-light);
}

.top-tag {
  display: inline-block;
  background: #fef3c7;
  color: #d97706;
  font-size: 12px;
  padding: 1px 8px;
  border-radius: 4px;
  margin-bottom: 6px;
}

.news-meta {
  flex-shrink: 0;
  font-size: 13px;
  color: var(--color-text-light);
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 32px;
}

.pagination button {
  padding: 8px 16px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-white);
  cursor: pointer;
}

.pagination button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
