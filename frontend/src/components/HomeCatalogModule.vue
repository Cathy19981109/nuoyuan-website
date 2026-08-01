<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { getProductById, getProducts, getServiceById, getServices } from '@/api'
import ProductCard from '@/components/ProductCard.vue'

const props = defineProps({
  module: { type: Object, default: null },
})

const emit = defineEmits(['open-inquiry'])

const catalogType = ref('all') // all | product | service
const keyword = ref('')
const loading = ref(false)
const products = ref([])
const services = ref([])
const trackRef = ref(null)
const pageIndex = ref(0)
const visibleCount = 3
let searchTimer = null

const typeOptions = [
  { value: 'all', label: '全部' },
  { value: 'product', label: '产品' },
  { value: 'service', label: '服务' },
]

const extra = computed(() =>
  (props.module?.extra_json && typeof props.module.extra_json === 'object')
    ? props.module.extra_json
    : {}
)

const sectionTitle = computed(() =>
  String(props.module?.main_title || '').trim() || '基因编辑核心服务'
)

const sectionSubtitle = computed(() =>
  String(props.module?.body_text || '').trim()
  || '核心主打业务，覆盖 RNA 合成、CRISPR/Cas9 全套技术服务、基因与载体构建'
)

const showSearch = computed(() => extra.value.show_search !== false)

const sourceMode = computed(() =>
  extra.value.source_mode === 'manual' ? 'manual' : 'hot'
)

const pageSize = computed(() =>
  Math.min(48, Math.max(3, Number(extra.value.page_size || 24) || 24))
)

const manualItems = computed(() => {
  const rows = Array.isArray(props.module?.card_items_json) ? props.module.card_items_json : []
  return rows
    .map((row) => ({
      kind: row.kind === 'service' ? 'service' : 'product',
      id: Number(row.id || 0),
    }))
    .filter((row) => row.id > 0)
})

const moreLink = computed(() => {
  const to = String(extra.value.more_link || '').trim() || '/products'
  const label = String(extra.value.more_button_text || '').trim() || '查看全部产品'
  return { to, label }
})

const items = computed(() => {
  const mapProduct = (row) => ({
    ...row,
    _kind: 'product',
    _detailPath: `/products/${row.id}`,
  })
  const mapService = (row) => ({
    ...row,
    _kind: 'service',
    product_code: row.product_code || row.service_code || '',
    _detailPath: `/services/${row.id}`,
  })

  if (sourceMode.value === 'manual') {
    const productMap = new Map(products.value.map((row) => [Number(row.id), row]))
    const serviceMap = new Map(services.value.map((row) => [Number(row.id), row]))
    return manualItems.value
      .map((ref) => {
        if (ref.kind === 'service') {
          const row = serviceMap.get(ref.id)
          return row ? mapService(row) : null
        }
        const row = productMap.get(ref.id)
        return row ? mapProduct(row) : null
      })
      .filter(Boolean)
  }

  if (catalogType.value === 'product') return products.value.map(mapProduct)
  if (catalogType.value === 'service') return services.value.map(mapService)
  return [
    ...products.value.map(mapProduct),
    ...services.value.map(mapService),
  ]
})

const maxPage = computed(() => Math.max(0, Math.ceil(items.value.length / visibleCount) - 1))
const showArrows = computed(() => items.value.length > visibleCount)

async function loadManualCatalog() {
  const productIds = manualItems.value.filter((r) => r.kind === 'product').map((r) => r.id)
  const serviceIds = manualItems.value.filter((r) => r.kind === 'service').map((r) => r.id)
  const [productRows, serviceRows] = await Promise.all([
    Promise.all(productIds.map((id) => getProductById(id).catch(() => null))),
    Promise.all(serviceIds.map((id) => getServiceById(id).catch(() => null))),
  ])
  products.value = productRows.filter(Boolean)
  services.value = serviceRows.filter(Boolean)
}

async function loadHotCatalog() {
  const kw = keyword.value.trim()
  const params = {
    pageSize: pageSize.value,
    ...(kw ? { keyword: kw } : { isHot: 1 }),
  }
  const needProducts = catalogType.value !== 'service'
  const needServices = catalogType.value !== 'product'
  const [productRes, serviceRes] = await Promise.all([
    needProducts ? getProducts(params) : Promise.resolve({ list: [] }),
    needServices ? getServices(params) : Promise.resolve({ list: [] }),
  ])
  products.value = productRes?.list || []
  services.value = serviceRes?.list || []
}

async function loadCatalog() {
  loading.value = true
  pageIndex.value = 0
  try {
    if (sourceMode.value === 'manual') {
      await loadManualCatalog()
    } else {
      await loadHotCatalog()
    }
  } catch (err) {
    console.error(err.message)
    products.value = []
    services.value = []
  } finally {
    loading.value = false
    await nextTick()
    scrollToPage(0, false)
  }
}

function onKeywordInput() {
  if (sourceMode.value === 'manual') return
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    loadCatalog()
  }, 280)
}

function scrollToPage(index, smooth = true) {
  const el = trackRef.value
  if (!el) return
  const clamped = Math.min(Math.max(index, 0), maxPage.value)
  pageIndex.value = clamped
  const card = el.querySelector('.catalog-slide')
  const gap = 24
  const step = card ? card.getBoundingClientRect().width * visibleCount + gap * (visibleCount - 1) : el.clientWidth
  el.scrollTo({ left: clamped * step, behavior: smooth ? 'smooth' : 'auto' })
}

function prevPage() {
  scrollToPage(pageIndex.value - 1)
}

function nextPage() {
  scrollToPage(pageIndex.value + 1)
}

function onScroll() {
  const el = trackRef.value
  if (!el) return
  const card = el.querySelector('.catalog-slide')
  if (!card) return
  const gap = 24
  const step = card.getBoundingClientRect().width * visibleCount + gap * (visibleCount - 1)
  if (step <= 0) return
  pageIndex.value = Math.min(maxPage.value, Math.max(0, Math.round(el.scrollLeft / step)))
}

function syncDefaultType() {
  const t = String(extra.value.default_type || 'all')
  catalogType.value = ['product', 'service'].includes(t) ? t : 'all'
}

watch(catalogType, () => {
  if (sourceMode.value === 'manual') return
  loadCatalog()
})

watch(
  () => [
    props.module?.id,
    props.module?.main_title,
    props.module?.body_text,
    JSON.stringify(props.module?.extra_json || {}),
    JSON.stringify(props.module?.card_items_json || []),
  ],
  () => {
    syncDefaultType()
    loadCatalog()
  }
)

onMounted(() => {
  syncDefaultType()
  loadCatalog()
})

onBeforeUnmount(() => {
  if (searchTimer) clearTimeout(searchTimer)
})
</script>

<template>
  <section class="section catalog-section">
    <div class="container">
      <h2 class="section-title">{{ sectionTitle }}</h2>
      <p v-if="sectionSubtitle" class="section-subtitle">{{ sectionSubtitle }}</p>

      <div v-if="showSearch && sourceMode !== 'manual'" class="catalog-toolbar">
        <select v-model="catalogType" class="catalog-select" aria-label="选择产品或服务">
          <option v-for="opt in typeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
        <div class="catalog-search">
          <input
            v-model="keyword"
            class="catalog-input"
            type="search"
            placeholder="模糊搜索产品 / 服务名称、目录号…"
            @input="onKeywordInput"
            @keyup.enter="loadCatalog"
          />
          <button type="button" class="catalog-search-btn" @click="loadCatalog">搜索</button>
        </div>
      </div>

      <div v-if="loading" class="loading">加载中...</div>
      <div v-else-if="!items.length" class="empty">未找到相关产品或服务</div>
      <div v-else class="catalog-carousel">
        <button
          v-if="showArrows"
          type="button"
          class="nav-arrow prev"
          :disabled="pageIndex <= 0"
          aria-label="上一组"
          @click="prevPage"
        >
          ‹
        </button>

        <div ref="trackRef" class="catalog-track" @scroll.passive="onScroll">
          <div
            v-for="item in items"
            :key="`${item._kind}-${item.id}`"
            class="catalog-slide"
          >
            <ProductCard
              :product="item"
              @open-inquiry="emit('open-inquiry', $event)"
            />
          </div>
        </div>

        <button
          v-if="showArrows"
          type="button"
          class="nav-arrow next"
          :disabled="pageIndex >= maxPage"
          aria-label="下一组"
          @click="nextPage"
        >
          ›
        </button>
      </div>

      <div class="section-action">
        <RouterLink :to="moreLink.to" class="btn btn-primary">{{ moreLink.label }}</RouterLink>
      </div>
    </div>
  </section>
</template>

<style scoped>
.catalog-section {
  background: var(--color-bg);
}

.catalog-section .section-title,
.catalog-section .section-subtitle {
  text-align: center;
}

.catalog-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: center;
  margin: 0 auto 28px;
  max-width: 760px;
}

.catalog-select {
  min-width: 120px;
  height: 42px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 0 12px;
  background: #fff;
  color: var(--color-text);
  font-size: 14px;
}

.catalog-search {
  flex: 1;
  min-width: 240px;
  display: flex;
  gap: 8px;
}

.catalog-input {
  flex: 1;
  height: 42px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 0 14px;
  background: #fff;
  font-size: 14px;
}

.catalog-input:focus,
.catalog-select:focus {
  outline: none;
  border-color: var(--color-primary);
}

.catalog-search-btn {
  height: 42px;
  padding: 0 18px;
  border: none;
  border-radius: 10px;
  background: var(--color-accent);
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}

.catalog-search-btn:hover {
  filter: brightness(0.95);
}

.catalog-carousel {
  position: relative;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: stretch;
  gap: 8px;
}

.catalog-track {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: calc((100% - 48px) / 3);
  gap: 24px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  padding: 4px 2px 12px;
}

.catalog-track::-webkit-scrollbar {
  display: none;
}

.catalog-slide {
  scroll-snap-align: start;
  min-width: 0;
}

.catalog-slide :deep(.product-card) {
  height: 100%;
}

.nav-arrow {
  width: 40px;
  height: 40px;
  align-self: center;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: #fff;
  color: var(--color-primary);
  font-size: 28px;
  line-height: 1;
  cursor: pointer;
  box-shadow: var(--shadow);
}

.nav-arrow:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.nav-arrow:not(:disabled):hover {
  border-color: var(--color-primary);
  background: #eff6ff;
}

.section-action {
  text-align: center;
  margin-top: 32px;
}

.loading,
.empty {
  text-align: center;
  color: var(--color-text-light);
  padding: 32px 0;
}

@media (max-width: 1024px) {
  .catalog-track {
    grid-auto-columns: calc((100% - 24px) / 2);
  }
}

@media (max-width: 720px) {
  .catalog-carousel {
    grid-template-columns: 1fr;
  }

  .nav-arrow {
    display: none;
  }

  .catalog-track {
    grid-auto-columns: 88%;
    gap: 14px;
    padding-bottom: 8px;
  }

  .catalog-toolbar {
    flex-direction: column;
    align-items: stretch;
    margin-bottom: 20px;
    gap: 10px;
  }

  .catalog-select {
    width: 100%;
    min-width: 0;
    height: 46px;
    font-size: 15px;
  }

  .catalog-search {
    min-width: 0;
    width: 100%;
  }

  .catalog-input {
    height: 46px;
    font-size: 16px; /* iOS 避免自动放大输入框 */
  }

  .catalog-search-btn {
    height: 46px;
    padding: 0 16px;
    font-size: 15px;
    flex-shrink: 0;
  }

  .section-action {
    margin-top: 24px;
  }

  .section-action .btn {
    width: 100%;
    max-width: none;
  }
}

@media (max-width: 430px) {
  .catalog-track {
    grid-auto-columns: 92%;
  }

  .catalog-section .section-subtitle {
    font-size: 15px;
    padding: 0 2px;
  }
}
</style>
