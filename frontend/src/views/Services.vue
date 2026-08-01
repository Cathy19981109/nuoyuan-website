<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import { getServices, getServiceCategories, getServiceFilterStats, getPageModules } from '@/api'
import ProductCard from '@/components/ProductCard.vue'
import ModuleRenderer from '@/components/modules/ModuleRenderer.vue'
import CatalogHeroBanner from '@/components/catalog/CatalogHeroBanner.vue'
import PageBreadcrumb from '@/components/catalog/PageBreadcrumb.vue'
import { applySeoMeta } from '@/composables/useSeo'
import { useCatalogModules } from '@/composables/useCatalogModules'

const emit = defineEmits(['open-inquiry'])

const categories = ref([])
const services = ref([])
const pageModules = ref([])
const loading = ref(true)
const activeCategoryIds = ref([])
const keyword = ref('')
const activeProductTypes = ref([])
const activeAppTypes = ref([])
const activeLevelTags = ref([])
const filterStats = ref({ product_type: [], app_type: [], level_tag: [] })
const filterGroups = ref([])
const page = ref(1)
const pageSize = ref(20)
const pagination = ref({ total: 0, totalPages: 1 })
const jumpPage = ref(1)
const route = useRoute()

const {
  bannerModule,
  bannerImage,
  listModuleIndex,
  normalModules,
  modulesBeforeList,
  modulesAfterList,
} = useCatalogModules(pageModules, {
  bannerSystemKey: 'services_banner',
  bannerModuleName: 'Banner模块',
  listSystemKey: 'services_list_block',
  listModuleNameIncludes: '列表模块',
})

const breadcrumbs = computed(() => {
  const items = [
    { label: '首页', to: '/' },
    { label: '技术服务', to: '/services' },
  ]
  const first = categories.value.find((c) => activeCategoryIds.value.includes(c.id))
  if (first?.name) items.push({ label: first.name })
  return items
})

async function loadServices() {
  loading.value = true
  try {
    const params = {
      page: page.value,
      pageSize: pageSize.value,
      keyword: keyword.value,
      productType: activeProductTypes.value.join(','),
      productTypes: activeProductTypes.value.join(','),
      appType: activeAppTypes.value.join(','),
      appTypes: activeAppTypes.value.join(','),
      levelTag: activeLevelTags.value.join(','),
      levelTags: activeLevelTags.value.join(','),
      tagFilters: JSON.stringify(buildTagFilters()),
    }
    if (activeCategoryIds.value.length) params.categoryIds = activeCategoryIds.value.join(',')
    const data = await getServices(params)
    services.value = data.list || []
    pagination.value = data.pagination || { total: 0, totalPages: 1 }
  } finally {
    loading.value = false
  }
}

async function loadFilterStats() {
  try {
    filterStats.value = await getServiceFilterStats({
      keyword: keyword.value,
      productType: activeProductTypes.value.join(','),
      productTypes: activeProductTypes.value.join(','),
      appType: activeAppTypes.value.join(','),
      appTypes: activeAppTypes.value.join(','),
      levelTag: activeLevelTags.value.join(','),
      levelTags: activeLevelTags.value.join(','),
      tagFilters: JSON.stringify(buildTagFilters()),
    })
    filterGroups.value = Array.isArray(filterStats.value?.groups) ? filterStats.value.groups : []
  } catch {
    filterStats.value = { product_type: [], app_type: [], level_tag: [] }
    filterGroups.value = []
  }
}

onMounted(async () => {
  try {
    const cats = await getServiceCategories()
    categories.value = cats || []
    const routeIds = normalizeCategoryIds(route.query.categoryIds || route.query.categoryId)
    if (routeIds.length) activeCategoryIds.value = routeIds
    if (route.query.keyword) keyword.value = String(route.query.keyword)
    pageModules.value = await getPageModules('services')
    await loadFilterStats()
    await loadServices()
    await applySeoMeta({ pageKey: 'services' })
  } finally {
    loading.value = false
  }
})

watch(
  () => route.query,
  async (query) => {
    const nextCategoryIds = normalizeCategoryIds(query.categoryIds || query.categoryId)
    const nextKeyword = query.keyword ? String(query.keyword) : ''
    activeCategoryIds.value = nextCategoryIds
    keyword.value = nextKeyword
    page.value = 1
    await loadFilterStats()
    await loadServices()
  },
  { deep: true }
)

watch([activeCategoryIds, activeProductTypes, activeAppTypes, activeLevelTags, keyword, pageSize], async () => {
  page.value = 1
  await loadFilterStats()
  await loadServices()
}, { deep: true })

function toggleCategory(id) {
  if (activeCategoryIds.value.includes(id)) {
    activeCategoryIds.value = activeCategoryIds.value.filter((v) => v !== id)
  } else {
    activeCategoryIds.value = [...activeCategoryIds.value, id]
  }
}

function normalizeCategoryIds(raw) {
  if (!raw) return []
  if (Array.isArray(raw)) return raw.map((v) => Number(v)).filter((n) => Number.isFinite(n) && n > 0)
  return String(raw)
    .split(',')
    .map((v) => Number(v.trim()))
    .filter((n) => Number.isFinite(n) && n > 0)
}

function clearAll() {
  activeCategoryIds.value = []
  activeProductTypes.value = []
  activeAppTypes.value = []
  activeLevelTags.value = []
  keyword.value = ''
  page.value = 1
}

const pageTitleText = computed(() => {
  if (!activeCategoryIds.value.length) return '技术服务'
  const first = categories.value.find((c) => activeCategoryIds.value.includes(c.id))
  return first?.name ? `${first.name}及相关服务` : '技术服务'
})

function goTo(p) {
  const safe = Math.min(Math.max(Number(p || 1), 1), pagination.value.totalPages || 1)
  page.value = safe
  loadServices()
}

function buildTagFilters() {
  const map = {}
  if (activeProductTypes.value.length) map.product_type = activeProductTypes.value
  if (activeAppTypes.value.length) map.app_type = activeAppTypes.value
  if (activeLevelTags.value.length) map.level_tag = activeLevelTags.value
  return map
}
</script>

<template>
  <div>
    <CatalogHeroBanner
      :title="bannerModule?.main_title || '技术服务'"
      :subtitle="bannerModule?.body_text || 'CRISPR/Cas9 全套技术服务 · 基因编辑一站式解决方案'"
      :background-image="bannerImage"
    />
    <PageBreadcrumb :items="breadcrumbs" />
    <section class="section">
      <div class="container">
        <ModuleRenderer :modules="modulesBeforeList" />
      </div>
      <div class="container product-layout">
        <aside class="filter-panel">
          <div class="filter-head">
            <h3>服务筛选</h3>
            <button class="clear-btn" @click="clearAll">清空</button>
          </div>
          <div class="filter-group">
            <div class="group-title">服务类型</div>
            <label v-for="tag in filterStats.product_type || []" :key="tag.name" class="filter-item">
              <input type="checkbox" v-model="activeProductTypes" :value="tag.name" />
              <span>{{ tag.name }}</span>
              <span class="count">[{{ tag.total }}]</span>
            </label>
          </div>
          <div class="filter-group">
            <div class="group-title">应用分类</div>
            <label v-for="tag in filterStats.app_type || []" :key="tag.name" class="filter-item">
              <input type="checkbox" v-model="activeAppTypes" :value="tag.name" />
              <span>{{ tag.name }}</span>
              <span class="count">[{{ tag.total }}]</span>
            </label>
          </div>
          <div class="filter-group">
            <div class="group-title">级别</div>
            <label v-for="tag in filterStats.level_tag || []" :key="tag.name" class="filter-item">
              <input type="checkbox" v-model="activeLevelTags" :value="tag.name" />
              <span>{{ tag.name }}</span>
              <span class="count">[{{ tag.total }}]</span>
            </label>
          </div>
          <div class="filter-group">
            <div class="group-title">服务分类</div>
          <label v-for="cat in categories" :key="cat.id" class="filter-item">
            <input type="checkbox" :checked="activeCategoryIds.includes(cat.id)" @change="toggleCategory(cat.id)" />
            <span>{{ cat.name }}</span>
          </label>
          </div>
        </aside>
        <div class="products-main">
          <div class="search-bar">
            <h3>{{ pageTitleText }}</h3>
            <div class="search-right">
              <input v-model="keyword" class="search-input" placeholder="按照目录号、服务名称、关键词进行搜索" @keyup.enter="goTo(1)" />
              <button class="search-btn" @click="goTo(1)">🔍</button>
            </div>
          </div>
          <div v-if="loading" class="loading">加载中...</div>
          <div v-else-if="services.length" class="card-grid">
            <ProductCard
              v-for="item in services"
              :key="item.id"
              :product="{ ...item, _detailPath: `/services/${item.id}` }"
              @open-inquiry="$emit('open-inquiry', $event)"
            />
          </div>
          <div v-else class="empty">暂无技术服务</div>
          <div class="pagination" v-if="pagination.total > 0">
            <select v-model.number="pageSize" class="page-size">
              <option :value="10">10条/页</option>
              <option :value="20">20条/页</option>
              <option :value="50">50条/页</option>
            </select>
            <button class="btn-lite" :disabled="page <= 1" @click="goTo(1)">首页</button>
            <button class="btn-lite" :disabled="page <= 1" @click="goTo(page - 1)">上一页</button>
            <span>第 {{ page }} / {{ pagination.totalPages }} 页，共 {{ pagination.total }} 条</span>
            <button class="btn-lite" :disabled="page >= pagination.totalPages" @click="goTo(page + 1)">下一页</button>
            <button class="btn-lite" :disabled="page >= pagination.totalPages" @click="goTo(pagination.totalPages)">末页</button>
            <input v-model.number="jumpPage" type="number" min="1" :max="pagination.totalPages || 1" class="jump-input" />
            <button class="btn-lite" @click="goTo(jumpPage)">跳转</button>
          </div>
        </div>
      </div>
      <div class="container">
        <ModuleRenderer :modules="modulesAfterList" />
      </div>
    </section>
    <ModuleRenderer v-if="listModuleIndex < 0" :modules="normalModules" />
  </div>
</template>

<style scoped>
.product-layout { display: grid; grid-template-columns: 260px 1fr; gap: 24px; align-items: start; }
.filter-panel { position: sticky; top: 90px; border: 1px solid var(--color-border); border-radius: 10px; padding: 16px; background: #fff; max-height: calc(100vh - 120px); overflow: auto; }
.filter-panel h3 { margin-bottom: 10px; font-size: 15px; color: var(--color-primary); }
.filter-item { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; color: var(--color-text-light); cursor: pointer; }
.products-main { min-height: 240px; }
.filter-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.clear-btn { border: 1px solid #22c55e; color: #15803d; background: #f0fdf4; border-radius: 14px; padding: 4px 10px; cursor: pointer; }
.filter-group { border-top: 1px solid #e2e8f0; padding-top: 10px; margin-top: 10px; }
.group-title { font-size: 14px; font-weight: 600; color: #0f172a; margin-bottom: 8px; }
.count { margin-left: auto; font-size: 12px; color: #64748b; }
.search-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; gap: 12px; }
.search-right { display: flex; align-items: center; gap: 8px; width: min(520px, 100%); }
.search-input { flex: 1; border: 1px solid #d1d5db; border-radius: 20px; padding: 9px 12px; }
.search-btn { border: none; background: #65a30d; color: #fff; border-radius: 999px; width: 36px; height: 36px; cursor: pointer; }
.pagination { margin-top: 18px; display: flex; flex-wrap: wrap; align-items: center; gap: 8px; color: #334155; font-size: 13px; }
.page-size, .jump-input { border: 1px solid #d1d5db; border-radius: 6px; padding: 5px 8px; }
.jump-input { width: 82px; }
.btn-lite { border: 1px solid #d1d5db; background: #fff; border-radius: 6px; padding: 5px 10px; cursor: pointer; }
</style>
