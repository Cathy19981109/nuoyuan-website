<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import { getProductCategories, getProducts, getPageModules, getProductFilterStats } from '@/api'
import ProductCard from '@/components/ProductCard.vue'
import ModuleRenderer from '@/components/modules/ModuleRenderer.vue'
import CatalogHeroBanner from '@/components/catalog/CatalogHeroBanner.vue'
import PageBreadcrumb from '@/components/catalog/PageBreadcrumb.vue'
import { applySeoMeta } from '@/composables/useSeo'
import { useCatalogModules } from '@/composables/useCatalogModules'

const emit = defineEmits(['open-inquiry'])

const route = useRoute()
const categories = ref([])
const products = ref([])
const activeCategories = ref([])
const loading = ref(true)
const pageModules = ref([])
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
const fallbackFiltering = ref(false)
const categoryParentMap = ref(new Map())
const categoryChildrenMap = ref(new Map())

const {
  bannerModule,
  bannerImage,
  listModuleIndex,
  normalModules,
  modulesBeforeList,
  modulesAfterList,
} = useCatalogModules(pageModules, {
  bannerSystemKey: 'products_banner',
  bannerModuleName: '产品页Banner模块',
  listSystemKey: 'products_list_block',
  listModuleNameIncludes: '产品列表模块（系统）',
})

const pageTitleText = computed(() => {
  const active = categories.value.find((c) => activeCategories.value.includes(c.id))
  return active?.name ? `${active.name}及相关产品` : '产品中心'
})

const breadcrumbs = computed(() => {
  const items = [
    { label: '首页', to: '/' },
    { label: '产品中心', to: '/products' },
  ]
  const active = categories.value.find((c) => activeCategories.value.includes(c.id))
  if (active?.name) items.push({ label: active.name })
  return items
})

function normalizeCategoryIds(raw) {
  if (!raw) return []
  if (Array.isArray(raw)) return raw.map((v) => Number(v)).filter((n) => Number.isFinite(n) && n > 0)
  return String(raw)
    .split(',')
    .map((v) => Number(v.trim()))
    .filter((n) => Number.isFinite(n) && n > 0)
}

async function loadCategories() {
  const rows = await getProductCategories()
  categories.value = rows
  const flat = []
  const walk = (nodes = [], parentId = 0) => {
    nodes.forEach((node) => {
      const id = Number(node.id)
      const pid = Number(node.parent_id || parentId || 0)
      flat.push({ id, parent_id: pid })
      if (!categoryChildrenMap.value.has(pid)) categoryChildrenMap.value.set(pid, [])
      categoryChildrenMap.value.get(pid).push(id)
      if (!categoryParentMap.value.has(id)) categoryParentMap.value.set(id, pid)
      if (Array.isArray(node.children) && node.children.length) walk(node.children, id)
    })
  }
  categoryParentMap.value = new Map()
  categoryChildrenMap.value = new Map()
  walk(rows, 0)
}

async function loadFilterStats() {
  try {
    filterStats.value = await getProductFilterStats({
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

async function loadProducts() {
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
    if (activeCategories.value.length) params.categoryIds = activeCategories.value.join(',')
    const data = await getProducts(params)
    const remoteList = data.list || []
    const localFiltered = applyLocalFilter(remoteList)
    // 如果远端没有正确过滤，前端兜底强制过滤显示
    fallbackFiltering.value = localFiltered.length !== remoteList.length
      || hasActiveFilters()
    products.value = hasActiveFilters() ? localFiltered : remoteList
    if (hasActiveFilters()) {
      pagination.value = {
        total: localFiltered.length,
        page: 1,
        pageSize: pageSize.value,
        totalPages: 1,
      }
    } else {
      pagination.value = data.pagination || { total: 0, totalPages: 1 }
    }
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await loadCategories()
  pageModules.value = await getPageModules('products')
  const routeCategoryIds = normalizeCategoryIds(route.query.categoryIds || route.query.categoryId)
  if (routeCategoryIds.length) activeCategories.value = routeCategoryIds
  if (route.query.keyword) keyword.value = String(route.query.keyword)
  await loadFilterStats()
  await loadProducts()
  await applySeoMeta({ pageKey: 'products' })
})

watch(
  () => route.query,
  async (query) => {
    const nextCategoryIds = normalizeCategoryIds(query.categoryIds || query.categoryId)
    const nextKeyword = query.keyword ? String(query.keyword) : ''
    activeCategories.value = nextCategoryIds
    keyword.value = nextKeyword
    page.value = 1
    await Promise.allSettled([loadFilterStats()])
    await loadProducts()
  },
  { deep: true }
)

watch([activeCategories, activeProductTypes, activeAppTypes, activeLevelTags, keyword, pageSize], async () => {
  page.value = 1
  await Promise.allSettled([loadFilterStats()])
  await loadProducts()
}, { deep: true })

function toggleCategory(id) {
  if (activeCategories.value.includes(id)) {
    activeCategories.value = activeCategories.value.filter((v) => v !== id)
  } else {
    activeCategories.value = [...activeCategories.value, id]
  }
}

function clearAll() {
  activeCategories.value = []
  activeProductTypes.value = []
  activeAppTypes.value = []
  activeLevelTags.value = []
  keyword.value = ''
  page.value = 1
}

function goTo(p) {
  const safe = Math.min(Math.max(Number(p || 1), 1), pagination.value.totalPages || 1)
  page.value = safe
  loadProducts()
}

function splitTags(raw) {
  if (Array.isArray(raw)) return raw.map((v) => String(v || '').trim()).filter(Boolean)
  if (typeof raw === 'string') return raw.split(',').map((v) => v.trim()).filter(Boolean)
  return []
}

function hasActiveFilters() {
  return !!(
    keyword.value.trim()
    || activeProductTypes.value.length
    || activeAppTypes.value.length
    || activeLevelTags.value.length
    || activeCategories.value.length
  )
}

function expandCategoryIds(ids = []) {
  const visited = new Set()
  const queue = [...ids]
  while (queue.length) {
    const current = Number(queue.shift())
    if (!Number.isFinite(current) || current <= 0 || visited.has(current)) continue
    visited.add(current)
    const children = categoryChildrenMap.value.get(current) || []
    children.forEach((childId) => {
      if (!visited.has(childId)) queue.push(childId)
    })
  }
  return visited
}

function applyLocalFilter(rows) {
  const key = keyword.value.trim().toLowerCase()
  const categoryBucket = expandCategoryIds(activeCategories.value)
  return (rows || []).filter((item) => {
    if (activeCategories.value.length && !categoryBucket.has(Number(item.category_id))) return false
    const map = item.filter_tags || {}
    const pTypes = item.product_type_list?.length ? item.product_type_list : (map.product_type || splitTags(item.product_type))
    const aTypes = item.app_type_list?.length ? item.app_type_list : (map.app_type || splitTags(item.app_type))
    const lTags = item.level_tag_list?.length ? item.level_tag_list : (map.level_tag || splitTags(item.level_tag))
    if (activeProductTypes.value.length && !activeProductTypes.value.some((tag) => pTypes.includes(tag))) return false
    if (activeAppTypes.value.length && !activeAppTypes.value.some((tag) => aTypes.includes(tag))) return false
    if (activeLevelTags.value.length && !activeLevelTags.value.some((tag) => lTags.includes(tag))) return false
    if (!key) return true
    const haystack = [
      item.name,
      item.en_name,
      item.goods_code,
      item.short_desc,
      pTypes.join(','),
      aTypes.join(','),
      lTags.join(','),
    ].map((v) => String(v || '').toLowerCase()).join(' ')
    return haystack.includes(key)
  })
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
      :title="bannerModule?.main_title || '产品中心'"
      :subtitle="bannerModule?.body_text || '基因编辑核心服务 · 科研实验试剂产品'"
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
            <h3>产品筛选</h3>
            <button class="clear-btn" @click="clearAll">清空</button>
          </div>
          
          <div class="filter-group">
            <div class="group-title">产品类型</div>
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
        </aside>
        <div class="products-main">
          <div class="search-bar">
            <h3>{{ pageTitleText }}</h3>
            <div class="search-right">
              <input v-model="keyword" class="search-input" placeholder="按照目录号、产品名称、关键词或者应用进行搜索" @keyup.enter="goTo(1)" />
              <button class="search-btn" @click="goTo(1)">🔍</button>
            </div>
          </div>
          <div v-if="loading" class="loading">加载中...</div>
          <div v-else-if="products.length" class="card-grid">
            <ProductCard
              v-for="item in products"
              :key="item.id"
              :product="item"
              @open-inquiry="$emit('open-inquiry', $event)"
            />
          </div>
          <div v-else class="empty">暂无符合筛选条件的产品</div>
          <div v-if="fallbackFiltering" class="hint-line">已按当前筛选条件实时过滤结果</div>
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
.filter-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.clear-btn { border: 1px solid #22c55e; color: #15803d; background: #f0fdf4; border-radius: 14px; padding: 4px 10px; cursor: pointer; }
.filter-group { border-top: 1px solid #e2e8f0; padding-top: 10px; margin-top: 10px; }
.group-title { font-size: 14px; font-weight: 600; color: #0f172a; margin-bottom: 8px; }
.count { margin-left: auto; font-size: 12px; color: #64748b; }
.products-main { min-height: 240px; }
.search-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; gap: 12px; }
.search-right { display: flex; align-items: center; gap: 8px; width: min(520px, 100%); }
.search-input { flex: 1; border: 1px solid #d1d5db; border-radius: 20px; padding: 9px 12px; }
.search-btn { border: none; background: #65a30d; color: #fff; border-radius: 999px; width: 36px; height: 36px; cursor: pointer; }
.pagination { margin-top: 18px; display: flex; flex-wrap: wrap; align-items: center; gap: 8px; color: #334155; font-size: 13px; }
.page-size, .jump-input { border: 1px solid #d1d5db; border-radius: 6px; padding: 5px 8px; }
.jump-input { width: 82px; }
.btn-lite { border: 1px solid #d1d5db; background: #fff; border-radius: 6px; padding: 5px 10px; cursor: pointer; }
.hint-line { color: #15803d; font-size: 12px; margin-top: 8px; }
</style>
