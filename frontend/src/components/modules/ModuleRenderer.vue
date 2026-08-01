<template>
  <div v-if="modules.length" class="dynamic-modules">
    <section
      v-for="item in modules"
      :id="sectionDomId(item)"
      :key="item.id"
      class="dynamic-module"
    >
      <div class="container">
        <div v-if="item.module_template === 'full_width_single_image'" class="full-image">
          <img v-if="firstImage(item)" :src="toPublicUrl(firstImage(item))" :alt="item.module_name" @error="onImgError" />
        </div>

        <div v-else-if="item.module_template === 'image_text_split'" class="image-text" :class="`layout-${normalizeLayout(item)}`">
          <div class="img-box">
            <img v-if="firstImage(item)" :src="toPublicUrl(firstImage(item))" :alt="item.main_title || item.module_name" @error="onImgError" />
            <div v-if="normalizeLayout(item) === 'overlay'" class="overlay">
              <h3>{{ item.main_title }}</h3>
              <p>{{ item.body_text }}</p>
            </div>
          </div>
          <div v-if="normalizeLayout(item) !== 'overlay'" class="text-box">
            <h3>{{ item.main_title }}</h3>
            <p>{{ item.body_text }}</p>
          </div>
        </div>

        <div
          v-else-if="item.module_template === 'multi_image_carousel'"
          class="carousel image-text"
          :class="`layout-${normalizeLayout(item, 'bottom')}`"
        >
          <div class="img-box carousel-media">
            <div class="carousel-grid">
              <img
                v-for="(img, idx) in images(item)"
                :key="idx"
                :src="toPublicUrl(img.url || img)"
                :alt="img.name || `轮播图${idx + 1}`"
                @error="onImgError"
              />
            </div>
          </div>
          <div v-if="item.main_title || item.body_text" class="text-box carousel-text">
            <h3 v-if="item.main_title">{{ item.main_title }}</h3>
            <p v-if="item.body_text">{{ item.body_text }}</p>
          </div>
        </div>

        <div v-else-if="item.module_template === 'single_video_module'" class="video-box">
          <video v-if="item.video_url" controls :src="toPublicUrl(item.video_url)" />
          <h3>{{ item.main_title }}</h3>
          <p>{{ item.body_text }}</p>
        </div>

        <div v-else-if="item.module_template === 'image_jump_button'" class="jump-box">
          <img v-if="firstImage(item)" :src="toPublicUrl(firstImage(item))" :alt="item.module_name" @error="onImgError" />
          <div class="jump-actions">
            <a v-if="item.jump_type === 'external' && item.link_url" :href="item.link_url" target="_blank" class="btn btn-primary">查看详情</a>
            <router-link v-else-if="item.jump_type === 'product' && item.jump_product_code" :to="`/search?keyword=${encodeURIComponent(item.jump_product_code)}`" class="btn btn-primary">查看产品</router-link>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
const props = defineProps({
  modules: { type: Array, default: () => [] },
  /** Optional id prefix for anchor navigation, e.g. news-module → news-module-12 */
  sectionIdPrefix: { type: String, default: 'module' },
})

const FALLBACK_IMAGE = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='675'><rect width='100%' height='100%' fill='%23f1f5f9'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%2394a3b8' font-size='32'>image unavailable</text></svg>"

function sectionDomId(item) {
  if (item?.id == null) return undefined
  return `${props.sectionIdPrefix}-${item.id}`
}

function normalizeLayout(item, fallback = 'top') {
  const mode = item?.layout_mode || fallback
  return mode
}

function images(item) {
  return Array.isArray(item.image_list_json) ? item.image_list_json : []
}

function firstImage(item) {
  const list = images(item)
  if (!list.length) return ''
  const first = list[0]
  return typeof first === 'string' ? first : (first.url || '')
}

function toPublicUrl(url) {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return url.startsWith('/') ? url : `/${url}`
}

function onImgError(event) {
  if (event?.target) event.target.src = FALLBACK_IMAGE
}
</script>

<style scoped>
.dynamic-module {
  scroll-margin-top: calc(var(--header-height) + 64px);
  padding: 20px 0;
}
.dynamic-modules .dynamic-module + .dynamic-module {
  padding-top: 8px;
}
.full-image img { width: 100%; border-radius: 12px; }
.image-text { display: grid; gap: 24px; }
.image-text.layout-left,
.image-text.layout-right {
  align-items: start;
}
/* 图左文右：图片 7，文字 3 */
.image-text.layout-left {
  grid-template-columns: 7fr 3fr;
}
/* 文左图右：文字 3，图片 7 */
.image-text.layout-right {
  grid-template-columns: 3fr 7fr;
}
/* 图左文右 */
.image-text.layout-left .img-box { order: 1; }
.image-text.layout-left .text-box { order: 2; }
/* 文左图右 */
.image-text.layout-right .text-box { order: 1; }
.image-text.layout-right .img-box { order: 2; }
/* 图上文下 */
.image-text.layout-top .img-box { order: 1; }
.image-text.layout-top .text-box { order: 2; }
/* 文上图下 */
.image-text.layout-bottom .text-box { order: 1; }
.image-text.layout-bottom .img-box { order: 2; }
.image-text .img-box img { width: 100%; border-radius: 12px; }
.overlay { position: absolute; inset: 0; background: rgba(15, 23, 42, 0.45); color: #fff; padding: 20px; border-radius: 12px; display: flex; flex-direction: column; justify-content: flex-end; }
.img-box { position: relative; min-width: 0; }
.text-box { min-width: 0; }
.text-box h3 { margin-bottom: 8px; color: #0b2d5c; }
.text-box p { color: #475569; line-height: 1.8; }
.carousel-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
.carousel-grid img { width: 100%; border-radius: 10px; aspect-ratio: 16 / 9; object-fit: cover; }
.carousel-text h3 { margin-bottom: 8px; color: #0b2d5c; }
.carousel-text p { color: #475569; line-height: 1.8; }
.video-box video { width: 100%; border-radius: 12px; margin-bottom: 12px; }
.jump-box img { width: 100%; border-radius: 12px; margin-bottom: 12px; }
.jump-actions { display: flex; justify-content: center; }

@media (max-width: 768px) {
  .image-text.layout-left,
  .image-text.layout-right {
    grid-template-columns: 1fr;
  }
  .image-text.layout-left .text-box,
  .image-text.layout-right .text-box { order: 1; }
  .image-text.layout-left .img-box,
  .image-text.layout-right .img-box { order: 2; }
}
</style>
