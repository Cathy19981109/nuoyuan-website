<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { getProductById, getServiceById } from '@/api'
import { applySeoMeta } from '@/composables/useSeo'

defineEmits(['open-inquiry'])

const route = useRoute()
const product = ref(null)
const loading = ref(true)
const activeIndex = ref(0)
const isServiceDetail = route.path.startsWith('/services/')

const gallery = computed(() => {
  if (!product.value) return []
  if (Array.isArray(product.value.gallery_json) && product.value.gallery_json.length) return product.value.gallery_json
  if (product.value.banner_image) return [{ name: '头图', url: product.value.banner_image }]
  if (product.value.cover_image) return [{ name: '封面图', url: product.value.cover_image }]
  return []
})

const activeMedia = computed(() => gallery.value[activeIndex.value] || null)
const videoEnded = ref(false)
const mediaVideoRef = ref(null)
const leadVideoUrl = computed(() => String(product.value?.video_url || '').trim())
const shouldShowLeadVideo = computed(() => !!leadVideoUrl.value && !videoEnded.value)

function selectMedia(idx) {
  activeIndex.value = idx
}

function onLeadVideoEnded() {
  videoEnded.value = true
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
      <div class="page-banner">
        <div class="container">
          <h1>{{ product.name }}</h1>
          <p>{{ product.en_name }}</p>
        </div>
      </div>
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
                  :class="{ active: activeIndex === idx }"
                  @click="selectMedia(idx)"
                >
                  {{ item.name || `图${idx + 1}` }}
                </button>
              </div>
            </div>
            <div class="info-box">
              <h2>{{ product.name }}</h2>
              <p class="meta">{{ isServiceDetail ? '服务编号' : '产品编号' }}：{{ product.product_code || '-' }}</p>
              <p class="meta">商品编码：{{ product.goods_code || '-' }}</p>
              <p class="meta">产品规格：{{ product.spec_text || '-' }}</p>
              <p class="short-desc">{{ product.short_desc }}</p>
              <button class="btn btn-primary" @click="$emit('open-inquiry', product)">立即询价</button>
            </div>
          </div>
          <div v-if="product.core_advantage" class="advantages-box">
            <h3>核心优势</h3>
            <p>{{ product.core_advantage }}</p>
          </div>
          <div v-if="product.detail_richtext || product.content" class="content" v-html="product.detail_richtext || product.content" />
        </div>
      </section>
    </template>
    <div v-else class="empty">产品不存在</div>
  </div>
</template>

<style scoped>
.detail {
  max-width: 900px;
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

.media-main img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.media-main video {
  width: 100%;
  height: 100%;
  object-fit: cover;
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
  padding: 4px 8px;
  cursor: pointer;
}

.thumb.active {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.info-box h2 {
  margin-bottom: 10px;
}

.meta {
  margin-bottom: 6px;
  color: #334155;
  font-size: 14px;
}

.short-desc {
  margin: 12px 0 20px;
}

.detail-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 32px;
}

.short-desc {
  font-size: 16px;
  line-height: 1.8;
  color: var(--color-text-light);
  flex: 1;
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

.content :deep(p) {
  margin-bottom: 16px;
  line-height: 1.8;
}

.content :deep(img) {
  max-width: 100%;
  border-radius: 8px;
  margin: 16px 0;
}
</style>
