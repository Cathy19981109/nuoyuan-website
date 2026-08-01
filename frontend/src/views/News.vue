<script setup>
import { ref, onMounted, computed } from 'vue'
import { getNewsList, getPageModules } from '@/api'
import ModuleRenderer from '@/components/modules/ModuleRenderer.vue'
import CatalogHeroBanner from '@/components/catalog/CatalogHeroBanner.vue'
import PageBreadcrumb from '@/components/catalog/PageBreadcrumb.vue'
import { applySeoMeta } from '@/composables/useSeo'
import { useCatalogModules } from '@/composables/useCatalogModules'

const newsList = ref([])
const loading = ref(true)
const pagination = ref({ page: 1, pageSize: 10, totalPages: 0 })
const pageModules = ref([])

const {
  bannerModule,
  bannerImage,
  normalModules,
} = useCatalogModules(pageModules, {
  bannerSystemKey: 'news_banner',
  bannerModuleName: 'Banner模块',
})

const breadcrumbs = computed(() => [
  { label: '首页', to: '/' },
  { label: '新闻动态', to: '/news' },
])

const topLevelModules = computed(() =>
  (normalModules.value || []).filter((m) => Number(m.parent_id || 0) === 0)
)
const hasModules = computed(() => topLevelModules.value.length > 0)
const showEmptyPlaceholder = computed(() => !loading.value && !hasModules.value && !newsList.value.length)
const showNewsListSection = computed(() => loading.value || newsList.value.length > 0 || showEmptyPlaceholder.value)

async function loadNews(page = 1) {
  loading.value = true
  try {
    const params = { page, pageSize: pagination.value.pageSize }
    const data = await getNewsList(params)
    newsList.value = data.list || []
    pagination.value = { ...pagination.value, ...data.pagination }
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  pageModules.value = await getPageModules('news')
  await applySeoMeta({ pageKey: 'news' })
  await loadNews()
})
</script>

<template>
  <div class="news-page">
    <CatalogHeroBanner
      :title="bannerModule?.main_title || '新闻动态'"
      :subtitle="bannerModule?.body_text || '了解最新行业资讯与公司动态'"
      :background-image="bannerImage"
    />
    <PageBreadcrumb :items="breadcrumbs" />

    <section v-if="hasModules" class="articles-section">
      <ModuleRenderer
        :modules="topLevelModules"
        :all-modules="pageModules"
        section-id-prefix="news-module"
      />
    </section>

    <section v-if="showNewsListSection" class="section news-list-section">
      <div class="container">
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
        <div v-else-if="showEmptyPlaceholder" class="empty">暂无新闻</div>

        <div v-if="pagination.totalPages > 1" class="pagination">
          <button :disabled="pagination.page <= 1" @click="loadNews(pagination.page - 1)">上一页</button>
          <span>{{ pagination.page }} / {{ pagination.totalPages }}</span>
          <button :disabled="pagination.page >= pagination.totalPages" @click="loadNews(pagination.page + 1)">下一页</button>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.articles-section {
  padding: 8px 0 0;
}

.news-list-section {
  padding-top: 24px;
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
