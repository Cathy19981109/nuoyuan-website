<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import { searchSite } from '@/api'
import CatalogHeroBanner from '@/components/catalog/CatalogHeroBanner.vue'
import PageBreadcrumb from '@/components/catalog/PageBreadcrumb.vue'
import { DEFAULT_CATALOG_BANNER } from '@/composables/useCatalogModules'

const route = useRoute()
const results = ref({
  products: [],
  services: [],
  news: [],
  applications: [],
  modules: [],
  pages: [],
})
const loading = ref(false)
const keyword = ref('')

const breadcrumbs = computed(() => {
  const items = [
    { label: '首页', to: '/' },
    { label: '搜索结果', to: '/search' },
  ]
  if (keyword.value) items.push({ label: keyword.value })
  return items
})

const hasResults = computed(() =>
  ['products', 'services', 'modules', 'news', 'applications', 'pages'].some(
    (key) => (results.value[key] || []).length > 0
  )
)

async function doSearch(kw) {
  if (!kw.trim()) return
  loading.value = true
  try {
    results.value = await searchSite(kw.trim(), { pageSize: 20 })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  keyword.value = route.query.keyword || ''
  if (keyword.value) doSearch(keyword.value)
})

watch(
  () => route.query.keyword,
  (kw) => {
    keyword.value = kw || ''
    if (kw) doSearch(kw)
  }
)
</script>

<template>
  <div>
    <CatalogHeroBanner
      title="搜索结果"
      :subtitle="keyword ? `关键词：${keyword}` : '请输入关键词进行搜索'"
      :background-image="DEFAULT_CATALOG_BANNER"
    />
    <PageBreadcrumb :items="breadcrumbs" />
    <section class="section">
      <div class="container">
        <div v-if="loading" class="loading">搜索中...</div>
        <div v-else-if="!keyword" class="empty">请输入搜索关键词</div>
        <div v-else class="results">
          <div v-if="results.products?.length" class="result-group">
            <h2>产品 ({{ results.products.length }})</h2>
            <div class="result-list">
              <router-link
                v-for="item in results.products"
                :key="'p' + item.id"
                :to="`/products/${item.id}`"
                class="result-item"
              >
                <h3>{{ item.name }}</h3>
                <p>{{ item.short_desc }}</p>
              </router-link>
            </div>
          </div>

          <div v-if="results.services?.length" class="result-group">
            <h2>服务 ({{ results.services.length }})</h2>
            <div class="result-list">
              <router-link
                v-for="item in results.services"
                :key="'s' + item.id"
                :to="`/services/${item.id}`"
                class="result-item"
              >
                <h3>{{ item.name }}</h3>
                <p>{{ item.short_desc }}</p>
              </router-link>
            </div>
          </div>

          <div v-if="results.modules?.length" class="result-group">
            <h2>内容板块 ({{ results.modules.length }})</h2>
            <div class="result-list">
              <router-link
                v-for="item in results.modules"
                :key="'m' + item.id"
                :to="item.to || '/'"
                class="result-item"
              >
                <h3>{{ item.title || item.main_title || item.module_name }}</h3>
                <p>{{ item.short_desc }}</p>
              </router-link>
            </div>
          </div>

          <div v-if="results.news?.length" class="result-group">
            <h2>新闻 ({{ results.news.length }})</h2>
            <div class="result-list">
              <router-link
                v-for="item in results.news"
                :key="'n' + item.id"
                :to="`/news/${item.id}`"
                class="result-item"
              >
                <h3>{{ item.title }}</h3>
                <p>{{ item.short_desc }}</p>
              </router-link>
            </div>
          </div>

          <div v-if="results.applications?.length" class="result-group">
            <h2>应用 ({{ results.applications.length }})</h2>
            <div class="result-list">
              <router-link
                v-for="item in results.applications"
                :key="'a' + item.id"
                to="/applications"
                class="result-item"
              >
                <h3>{{ item.name }}</h3>
                <p>{{ item.short_desc }}</p>
              </router-link>
            </div>
          </div>

          <div v-if="results.pages?.length" class="result-group">
            <h2>页面 ({{ results.pages.length }})</h2>
            <div class="result-list">
              <router-link
                v-for="item in results.pages"
                :key="'pg' + item.id"
                :to="item.to || item.path || '/'"
                class="result-item"
              >
                <h3>{{ item.title || item.name }}</h3>
                <p>{{ item.short_desc || item.nav_name }}</p>
              </router-link>
            </div>
          </div>

          <div v-if="!hasResults" class="empty">未找到相关结果</div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.results {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.result-group h2 {
  font-size: 18px;
  color: var(--color-primary);
  margin-bottom: 12px;
}

.result-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.result-item {
  display: block;
  padding: 16px 18px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: #fff;
}

.result-item h3 {
  font-size: 16px;
  color: var(--color-primary);
  margin-bottom: 6px;
}

.result-item p {
  font-size: 13px;
  color: var(--color-text-light);
  line-height: 1.6;
}

.loading,
.empty {
  text-align: center;
  color: var(--color-text-light);
  padding: 40px 0;
}
</style>
