<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getProductById, getServiceById } from '@/api'
import { applySeoMeta } from '@/composables/useSeo'
import CatalogHeroBanner from '@/components/catalog/CatalogHeroBanner.vue'
import PageBreadcrumb from '@/components/catalog/PageBreadcrumb.vue'
import { DEFAULT_CATALOG_BANNER } from '@/composables/useCatalogModules'

const emit = defineEmits(['open-inquiry'])

const route = useRoute()
const product = ref(null)
const loading = ref(true)
const activeIndex = ref(0)
const isServiceDetail = route.path.startsWith('/services/')
const selectedVariantId = ref('')

const breadcrumbs = computed(() => {
  const items = [
    { label: '首页', to: '/' },
    isServiceDetail
      ? { label: '技术服务', to: '/services' }
      : { label: '产品中心', to: '/products' },
  ]
  if (product.value?.name) items.push({ label: product.value.name })
  return items
})

const detailBannerImage = computed(() =>
  product.value?.banner_image
  || product.value?.cover_image
  || product.value?.gallery_json?.[0]?.url
  || DEFAULT_CATALOG_BANNER
)

const gallery = computed(() => {
  if (!product.value) return []
  if (Array.isArray(product.value.gallery_json) && product.value.gallery_json.length) return product.value.gallery_json
  if (product.value.banner_image) return [{ name: '头图', url: product.value.banner_image }]
  if (product.value.cover_image) return [{ name: '封面图', url: product.value.cover_image }]
  return []
})

const activeVariants = computed(() => {
  const rows = Array.isArray(product.value?.variants) ? product.value.variants : []
  const enabled = rows.filter((v) => Number(v.status) !== 0 && String(v.name || '').trim())
  if (enabled.length) return enabled
  const legacy = Array.isArray(product.value?.spec_options) ? product.value.spec_options : []
  return legacy.map((name, idx) => ({
    id: `legacy_${idx}`,
    name,
    goods_code: product.value?.goods_code || '',
    price: '',
    image_url: '',
    status: 1,
  }))
})

const selectedVariant = computed(() => {
  return activeVariants.value.find((v) => String(v.id) === String(selectedVariantId.value)) || null
})

watch(
  activeVariants,
  (rows) => {
    if (!rows.length) {
      selectedVariantId.value = ''
      return
    }
    const stillValid = rows.some((v) => String(v.id) === String(selectedVariantId.value))
    if (!stillValid) selectedVariantId.value = String(rows[0].id)
  },
  { immediate: true, deep: true }
)

const activeMedia = computed(() => {
  if (selectedVariant.value?.image_url) {
    return { name: selectedVariant.value.name, url: selectedVariant.value.image_url }
  }
  return gallery.value[activeIndex.value] || null
})
const videoEnded = ref(false)
const mediaVideoRef = ref(null)
const leadVideoUrl = computed(() => String(product.value?.video_url || '').trim())
const shouldShowLeadVideo = computed(() => !!leadVideoUrl.value && !videoEnded.value && !selectedVariant.value?.image_url)

const detailMedia = computed(() => {
  return Array.isArray(product.value?.detail_media) ? product.value.detail_media.filter((m) => m?.url) : []
})

const specDocs = computed(() => {
  return Array.isArray(product.value?.spec_docs) ? product.value.spec_docs.filter((d) => d?.url) : []
})

function selectMedia(idx) {
  activeIndex.value = idx
  videoEnded.value = true
}

function onLeadVideoEnded() {
  videoEnded.value = true
}

function onInquiry() {
  const variant = selectedVariant.value
  emit('open-inquiry', {
    ...product.value,
    selected_variant: variant || null,
    variant_name: variant?.name || '',
    variant_goods_code: variant?.goods_code || '',
    variant_price: variant?.price || '',
    inquiry_product_name: variant?.name
      ? `${product.value.name}（${variant.name}）`
      : product.value.name,
  })
}

onMounted(async () => {
  try {
    product.value = isServiceDetail ? await getServiceById(route.params.id) : await getProductById(route.params.id)
    videoEnded.value = false
    if (isServiceDetail) await applySeoMeta({ pageKey: 'services' })
    else await applySeoMeta({ itemType: 'product', itemId: route.params.id })
  } catch (err) {
    console.error(err.message)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <div v-if="loading" class="loading">加载中...</div>
    <template v-else-if="product">
      <CatalogHeroBanner
        :title="product.name"
        :subtitle="product.en_name"
        :background-image="detailBannerImage"
      />
      <PageBreadcrumb :items="breadcrumbs" />
      <section class="section">
        <div class="container detail">
          <div class="hero-grid">
            <div class="media-box">
              <div class="media-main">
                <video
                  v-if="shouldShowLeadVideo"
                  ref="mediaVideoRef"
                  :src="leadVideoUrl"
                  autoplay
                  muted
                  playsinline
                  controls
                  @ended="onLeadVideoEnded"
                />
                <img v-else-if="activeMedia?.url" :src="activeMedia.url" :alt="product.name" />
              </div>
              <div class="media-thumbs">
                <button
                  v-for="(item, idx) in gallery"
                  :key="idx"
                  class="thumb"
                  :class="{ active: activeIndex === idx && !selectedVariant?.image_url }"
                  @click="selectMedia(idx)"
                >
                  <img v-if="item.url" :src="item.url" :alt="item.name || `图${idx + 1}`" />
                  <span v-else>{{ item.name || `图${idx + 1}` }}</span>
                </button>
              </div>
            </div>
            <div class="info-box">
              <h2>{{ product.name }}</h2>
              <p class="meta">{{ isServiceDetail ? '服务编号' : '产品编号' }}：{{ product.product_code || '-' }}</p>
              <p class="meta">商品编码：{{ selectedVariant?.goods_code || product.goods_code || '-' }}</p>
              <div v-if="activeVariants.length" class="variant-picker">
                <label>选择规格</label>
                <select v-model="selectedVariantId" class="variant-select">
                  <option
                    v-for="item in activeVariants"
                    :key="item.id"
                    :value="String(item.id)"
                  >
                    {{ item.name }}
                  </option>
                </select>
                <div class="variant-meta">
                  <span v-if="selectedVariant?.price">参考价：¥{{ selectedVariant.price }}</span>
                </div>
              </div>
              <p v-else class="meta">{{ isServiceDetail ? '服务规格' : '产品规格' }}：{{ product.spec_text || '-' }}</p>
              <p class="short-desc">{{ product.short_desc }}</p>
              <button class="btn btn-primary" @click="onInquiry">立即询价</button>
            </div>
          </div>
          <div v-if="product.core_advantage" class="advantages-box">
            <h3>核心优势</h3>
            <p>{{ product.core_advantage }}</p>
          </div>
          <div v-if="product.detail_richtext || product.content" class="content" v-html="product.detail_richtext || product.content" />

          <div v-if="detailMedia.length" class="spec-media-section">
            <h3>规格说明</h3>
            <div class="spec-media-list">
              <article v-for="(item, idx) in detailMedia" :key="idx" class="spec-media-item">
                <video v-if="item.type === 'video'" :src="item.url" controls playsinline />
                <img v-else :src="item.url" :alt="item.name || `说明图${idx + 1}`" />
                <div class="spec-media-caption">
                  <h4 v-if="item.name">{{ item.name }}</h4>
                  <p v-if="item.caption">{{ item.caption }}</p>
                </div>
              </article>
            </div>
          </div>

          <div v-if="specDocs.length" class="spec-docs-section">
            <h3>资料下载</h3>
            <ul class="spec-docs-list">
              <li v-for="(doc, idx) in specDocs" :key="idx">
                <a :href="doc.url" target="_blank" rel="noopener" download>
                  {{ doc.name || `说明书${idx + 1}` }}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </template>
    <div v-else class="empty">{{ isServiceDetail ? '服务不存在' : '产品不存在' }}</div>
  </div>
</template>

<style scoped>
.detail {
  max-width: 960px;
}

.hero-grid {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 24px;
  margin-bottom: 28px;
}

.media-box {
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 10px;
}

.media-main {
  width: 100%;
  aspect-ratio: 16 / 9;
  background: var(--color-bg);
  border-radius: 8px;
  overflow: hidden;
}

.media-main img,
.media-main video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.media-main video {
  background: #000;
}

.media-thumbs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.thumb {
  border: 1px solid var(--color-border);
  background: #fff;
  color: var(--color-text-light);
  border-radius: 6px;
  padding: 0;
  width: 64px;
  height: 48px;
  overflow: hidden;
  cursor: pointer;
}

.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.thumb.active {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 1px var(--color-primary);
}

.info-box h2 {
  margin-bottom: 10px;
}

.meta {
  margin-bottom: 6px;
  color: #334155;
  font-size: 14px;
}

.variant-picker {
  margin: 12px 0;
}

.variant-picker label {
  display: block;
  font-size: 13px;
  color: #64748b;
  margin-bottom: 6px;
}

.variant-select {
  width: 100%;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 14px;
  background: #fff;
}

.variant-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 8px;
  font-size: 13px;
  color: #0f172a;
}

.short-desc {
  margin: 12px 0 20px;
  font-size: 16px;
  line-height: 1.8;
  color: var(--color-text-light);
}

.advantages-box {
  background: var(--color-bg);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 32px;
}

.advantages-box h3 {
  color: var(--color-primary);
  margin-bottom: 8px;
}

.advantages-box p {
  color: var(--color-text-light);
  line-height: 1.8;
}

.content {
  margin-bottom: 32px;
}

.content :deep(p) {
  margin-bottom: 16px;
  line-height: 1.8;
}

.content :deep(img) {
  max-width: 100%;
  border-radius: 8px;
  margin: 16px 0;
}

.spec-media-section,
.spec-docs-section {
  margin-top: 8px;
  margin-bottom: 32px;
}

.spec-media-section h3,
.spec-docs-section h3 {
  color: var(--color-primary);
  margin-bottom: 16px;
  font-size: 20px;
}

.spec-media-list {
  display: grid;
  gap: 20px;
}

.spec-media-item {
  border: 1px solid var(--color-border);
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
}

.spec-media-item img,
.spec-media-item video {
  width: 100%;
  display: block;
  max-height: 480px;
  object-fit: contain;
  background: #0f172a;
}

.spec-media-caption {
  padding: 14px 16px 16px;
}

.spec-media-caption h4 {
  margin-bottom: 6px;
  font-size: 15px;
}

.spec-media-caption p {
  color: var(--color-text-light);
  line-height: 1.7;
  font-size: 14px;
  white-space: pre-wrap;
}

.spec-docs-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 10px;
}

.spec-docs-list a {
  display: block;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 12px 14px;
  color: #1d4ed8;
  background: #f8fafc;
}

.spec-docs-list a:hover {
  background: #eff6ff;
}

@media (max-width: 768px) {
  .hero-grid {
    grid-template-columns: 1fr;
  }
}
</style>
