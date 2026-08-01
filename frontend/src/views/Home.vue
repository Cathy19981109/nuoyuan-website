<script setup>
import { ref, onMounted, computed } from 'vue'
import { getPageModules } from '@/api'
import HomeCatalogModule from '@/components/HomeCatalogModule.vue'
import ModuleRenderer from '@/components/modules/ModuleRenderer.vue'
import { applySeoMeta } from '@/composables/useSeo'
import { useCatalogModules } from '@/composables/useCatalogModules'

defineProps({
  siteConfig: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['open-inquiry'])

const pageModules = ref([])

const {
  bannerModule,
  bannerImage,
  normalModules: baseNormalModules,
} = useCatalogModules(pageModules, {
  bannerSystemKey: 'home_banner',
  bannerModuleName: 'Banner模块',
  excludeSystemKeys: ['home_advantages', 'home_catalog_cards'],
})

const catalogModule = computed(() =>
  pageModules.value.find((m) => String(m?.extra_json?.system_key || '') === 'home_catalog_cards')
  || pageModules.value.find((m) => m.module_template === 'product_service_cards')
  || null
)

const normalModules = computed(() =>
  (baseNormalModules.value || []).filter((m) => m.module_template !== 'product_service_cards')
)

const advantageModule = computed(() =>
  pageModules.value.find((m) => String(m?.extra_json?.system_key || '') === 'home_advantages')
  || pageModules.value.find((m) => String(m?.module_name || '') === '核心优势')
  || null
)

const advantageImages = computed(() => {
  const list = Array.isArray(advantageModule.value?.image_list_json)
    ? advantageModule.value.image_list_json
    : []
  return list
    .map((item) => (typeof item === 'string' ? item : item?.url || ''))
    .map((url) => String(url || '').trim())
    .filter(Boolean)
})

const advantageImage = computed(() => advantageImages.value[0] || '')

const heroTitle = computed(() => String(bannerModule.value?.main_title || '').trim() || '诺元智合')
const heroEn = computed(() => {
  const fromExtra = String(bannerModule.value?.extra_json?.subtitle_en || '').trim()
  return fromExtra || 'NUOYUAN BIOTECH'
})
const heroDesc = computed(() =>
  String(bannerModule.value?.body_text || '').trim()
  || '专注基因编辑核心服务与科研实验试剂，为生命科学研究提供高品质解决方案'
)

const heroStyle = computed(() => {
  const url = bannerImage.value
  if (!url) return undefined
  const src = url.startsWith('http') || url.startsWith('/') ? url : `/${url}`
  return {
    backgroundImage: `linear-gradient(135deg, rgba(11, 45, 92, 0.72) 0%, rgba(15, 23, 42, 0.78) 100%), url(${src})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }
})

onMounted(async () => {
  try {
    pageModules.value = await getPageModules('home')
    await applySeoMeta({ pageKey: 'home' })
  } catch (err) {
    console.error(err.message)
  }
})
</script>

<template>
  <div class="home">
    <section class="hero" :style="heroStyle">
      <div class="container hero-content">
        <h1>{{ heroTitle }}</h1>
        <p class="hero-en">{{ heroEn }}</p>
        <p class="hero-desc">{{ heroDesc }}</p>
        <div class="hero-actions">
          <button type="button" class="btn btn-primary" @click="emit('open-inquiry')">立即询价</button>
        </div>
      </div>
    </section>

    <HomeCatalogModule
      v-if="catalogModule"
      :module="catalogModule"
      @open-inquiry="emit('open-inquiry', $event)"
    />
    <!-- 兼容：库中尚无该模块时仍展示默认热门卡片，避免首页空白 -->
    <HomeCatalogModule
      v-else
      @open-inquiry="emit('open-inquiry', $event)"
    />

    <section v-if="advantageImage" class="section advantages">
      <div class="container">
        <h2 class="section-title">{{ advantageModule?.main_title || '核心优势' }}</h2>
      </div>
      <div class="advantage-full">
        <img :src="advantageImage" alt="核心优势" />
      </div>
    </section>

    <ModuleRenderer :modules="normalModules" :all-modules="pageModules" content-align="center" />
  </div>
</template>

<style scoped>
.home :deep(.section-title),
.home :deep(.section-subtitle) {
  text-align: center;
}

.hero {
  position: relative;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  color: var(--color-white);
  padding: 80px 0 100px;
  text-align: center;
  overflow: hidden;
}

.hero-content {
  position: relative;
  z-index: 1;
  max-width: 720px;
  margin: 0 auto;
}

.hero h1 {
  font-size: 48px;
  font-weight: 700;
  margin-bottom: 8px;
}

.hero-en {
  font-size: 14px;
  letter-spacing: 4px;
  opacity: 0.7;
  margin-bottom: 24px;
}

.hero-desc {
  font-size: 18px;
  opacity: 0.9;
  max-width: 640px;
  margin: 0 auto 36px;
  line-height: 1.8;
}

.hero-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.advantages .section-title {
  text-align: center;
}

.advantages {
  background: var(--color-white);
  padding-bottom: 0;
}

.advantage-full {
  width: 100%;
  margin-top: 8px;
}

.advantage-full img {
  display: block;
  width: 100%;
  max-height: min(56vw, 720px);
  object-fit: cover;
  object-position: center;
}

@media (max-width: 768px) {
  .hero h1 {
    font-size: 32px;
  }

  .hero-actions {
    flex-direction: column;
    align-items: center;
  }
}
</style>
