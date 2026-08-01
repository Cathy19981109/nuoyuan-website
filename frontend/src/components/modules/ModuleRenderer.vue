<template>
  <div v-if="displayModules.length" class="dynamic-modules" :class="{ 'is-centered': contentAlign === 'center' }">
    <template v-for="item in displayModules" :key="item.id">
      <SubNavModule
        v-if="item.module_template === 'sub_nav_group'"
        :parent="item"
        :children="childrenOf(item)"
        :section-id-prefix="sectionIdPrefix"
      />

      <section
        v-else
        :id="sectionDomId(item)"
        class="dynamic-module"
      >
        <div class="container">
          <div v-if="item.module_template === 'full_width_single_image'" class="full-image">
            <img v-if="firstImage(item)" :src="toPublicUrl(firstImage(item))" :alt="item.module_name" @error="onImgError" />
          </div>

          <div
            v-else-if="item.module_template === 'image_text_split'"
            class="image-text"
            :class="contentAlign === 'center' ? 'layout-centered' : `layout-${normalizeLayout(item)}`"
          >
            <div class="img-box">
              <img v-if="firstImage(item)" :src="toPublicUrl(firstImage(item))" :alt="item.main_title || item.module_name" @error="onImgError" />
              <div v-if="normalizeLayout(item) === 'overlay' && contentAlign !== 'center'" class="overlay">
                <h3>{{ item.main_title }}</h3>
                <p>{{ item.body_text }}</p>
              </div>
            </div>
            <div v-if="normalizeLayout(item) !== 'overlay' || contentAlign === 'center'" class="text-box">
              <h3>{{ item.main_title }}</h3>
              <p>{{ item.body_text }}</p>
            </div>
          </div>

          <div
            v-else-if="item.module_template === 'multi_image_carousel'"
            class="carousel image-text"
            :class="contentAlign === 'center' ? 'layout-centered' : `layout-${carouselLayout(item)}`"
          >
            <div class="img-box carousel-media">
              <AutoImageCarousel :images="images(item)" :interval-ms="3000" />
            </div>
            <!-- 子导航内的轮播子模块可带标题/正文，并遵循后台图文布局；独立多图轮播仅图片 -->
            <div
              v-if="Number(item.parent_id || 0) > 0 && (item.main_title || item.body_text)"
              class="text-box carousel-text"
            >
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
    </template>
  </div>
</template>

<script setup>
import { computed, defineAsyncComponent } from 'vue'
import AutoImageCarousel from './AutoImageCarousel.vue'

const SubNavModule = defineAsyncComponent(() => import('./SubNavModule.vue'))

const props = defineProps({
  modules: { type: Array, default: () => [] },
  allModules: { type: Array, default: () => [] },
  sectionIdPrefix: { type: String, default: 'module' },
  contentAlign: { type: String, default: 'start' },
})

const FALLBACK_IMAGE = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='675'><rect width='100%' height='100%' fill='%23f1f5f9'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%2394a3b8' font-size='32'>image unavailable</text></svg>"

const displayModules = computed(() => {
  const list = props.modules || []
  return list.filter((m) => {
    const pid = Number(m?.parent_id || 0)
    if (pid <= 0) return true
    // Skip children that leaked into a list that also contains their parent
    return !list.some((x) => Number(x.id) === pid)
  })
})

function childrenOf(item) {
  const source = (props.allModules && props.allModules.length) ? props.allModules : props.modules
  return (source || [])
    .filter((m) => Number(m.parent_id) === Number(item.id))
    .slice()
    .sort((a, b) => (a.sort || 0) - (b.sort || 0) || (a.module_no || 0) - (b.module_no || 0))
}

function sectionDomId(item) {
  if (item?.id == null) return undefined
  return `${props.sectionIdPrefix}-${item.id}`
}

function normalizeLayout(item, fallback = 'top') {
  const mode = String(item?.layout_mode || '').trim()
  if (['left', 'right', 'top', 'bottom', 'overlay'].includes(mode)) return mode
  return fallback
}

/** 子导航轮播跟随后台布局；独立多图轮播仅图片，默认上下 */
function carouselLayout(item) {
  if (Number(item?.parent_id || 0) <= 0) return 'bottom'
  return normalizeLayout(item, 'bottom')
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
.full-image img { width: 100%; border-radius: 12px; display: block; margin: 0 auto; }
.image-text { display: grid; gap: 24px; }
.image-text.layout-left,
.image-text.layout-right {
  align-items: start;
}
.image-text.layout-left {
  grid-template-columns: 7fr 3fr;
}
.image-text.layout-right {
  grid-template-columns: 3fr 7fr;
}
.image-text.layout-left .img-box { order: 1; }
.image-text.layout-left .text-box { order: 2; }
.image-text.layout-right .text-box { order: 1; }
.image-text.layout-right .img-box { order: 2; }
.image-text.layout-top .img-box { order: 1; }
.image-text.layout-top .text-box { order: 2; }
.image-text.layout-bottom .text-box { order: 1; }
.image-text.layout-bottom .img-box { order: 2; }
.image-text.layout-centered {
  grid-template-columns: 1fr;
  justify-items: center;
  text-align: center;
  max-width: 920px;
  margin: 0 auto;
}
.image-text.layout-centered .text-box { order: 1; width: 100%; }
.image-text.layout-centered .img-box { order: 2; width: 100%; }
.image-text .img-box img { width: 100%; border-radius: 12px; display: block; margin: 0 auto; }
.overlay { position: absolute; inset: 0; background: rgba(15, 23, 42, 0.45); color: #fff; padding: 20px; border-radius: 12px; display: flex; flex-direction: column; justify-content: flex-end; }
.img-box { position: relative; min-width: 0; }
.text-box { min-width: 0; }
.text-box h3 { margin-bottom: 8px; color: #0b2d5c; }
.text-box p { color: #475569; line-height: 1.8; }
.is-centered .text-box h3,
.is-centered .text-box p,
.is-centered .video-box,
.is-centered .jump-box {
  text-align: center;
}
.is-centered .full-image,
.is-centered .video-box video,
.is-centered .jump-box img {
  margin-left: auto;
  margin-right: auto;
}
.carousel-media { min-width: 0; width: 100%; }
.carousel-text h3 { margin-bottom: 8px; color: #0b2d5c; }
.carousel-text p { color: #475569; line-height: 1.8; }
.video-box video { width: 100%; border-radius: 12px; margin-bottom: 12px; display: block; }
.jump-box img { width: 100%; border-radius: 12px; margin-bottom: 12px; display: block; }
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
