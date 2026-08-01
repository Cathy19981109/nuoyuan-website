<script setup>
import { computed, onMounted, ref } from 'vue'
import { getPageModules } from '@/api'
import ModuleRenderer from '@/components/modules/ModuleRenderer.vue'
import CatalogHeroBanner from '@/components/catalog/CatalogHeroBanner.vue'
import PageBreadcrumb from '@/components/catalog/PageBreadcrumb.vue'
import { applySeoMeta } from '@/composables/useSeo'
import { useCatalogModules } from '@/composables/useCatalogModules'

const props = defineProps({
  siteConfig: { type: Object, default: () => ({}) },
})

defineEmits(['open-inquiry'])

const pageModules = ref([])

const {
  bannerModule,
  bannerImage,
  normalModules,
} = useCatalogModules(pageModules, {
  bannerSystemKey: 'contact_banner',
  bannerModuleName: '联系我们Banner模块',
})

const breadcrumbs = computed(() => [
  { label: '首页', to: '/' },
  { label: '联系我们', to: '/contact' },
])

const mapEmbedUrl = computed(() => String(props.siteConfig?.contact_map_embed_url || '').trim())
const mapNavUrl = computed(() => String(props.siteConfig?.contact_map_nav_url || '').trim())
const hasMapIframe = computed(() => {
  const url = mapEmbedUrl.value.toLowerCase()
  return !!url && (url.startsWith('http://') || url.startsWith('https://'))
})

function openMapNav() {
  if (!mapNavUrl.value) return
  window.open(mapNavUrl.value, '_blank')
}

onMounted(async () => {
  try {
    pageModules.value = await getPageModules('contact')
  } catch {
    pageModules.value = []
  }
  applySeoMeta({ pageKey: 'contact' })
})
</script>

<template>
  <div>
    <CatalogHeroBanner
      :title="bannerModule?.main_title || '联系我们'"
      :subtitle="bannerModule?.body_text || '期待与您的合作，欢迎随时联系我们'"
      :background-image="bannerImage"
    />
    <PageBreadcrumb :items="breadcrumbs" />
    <section class="section">
      <div class="container contact-grid">
        <div class="contact-info">
          <h2>联系方式</h2>
          <div class="info-item">
            <span class="label">公司名称</span>
            <span>诺元智合 NUOYUAN BIOTECH</span>
          </div>
          <div v-if="siteConfig.contact_phone" class="info-item">
            <span class="label">联系电话</span>
            <span>{{ siteConfig.contact_phone }}</span>
          </div>
          <div v-if="siteConfig.contact_email" class="info-item">
            <span class="label">联系邮箱</span>
            <span>{{ siteConfig.contact_email }}</span>
          </div>
          <div v-if="siteConfig.contact_address" class="info-item">
            <span class="label">公司地址</span>
            <span>{{ siteConfig.contact_address }}</span>
          </div>
          <div class="info-item">
            <span class="label">业务咨询</span>
            <span>欢迎通过询价表单提交您的需求</span>
          </div>
          <button class="btn btn-primary contact-btn" @click="$emit('open-inquiry')">提交询价</button>
        </div>
        <div class="contact-map">
          <div class="map-card" :class="{ clickable: !!mapNavUrl }" @click="openMapNav">
            <iframe
              v-if="hasMapIframe"
              class="map-iframe"
              :src="mapEmbedUrl"
              title="高德地图"
              loading="lazy"
              referrerpolicy="no-referrer-when-downgrade"
            />
            <div v-else class="map-placeholder">
              <p>地图区域</p>
              <span>{{ siteConfig.contact_address || '可在后台配置地址信息后展示' }}</span>
              <small>请在后台填入高德地图嵌入链接后显示真实地图</small>
            </div>
          </div>
          <div class="map-actions">
            <button v-if="mapNavUrl" class="btn btn-secondary" @click.stop="openMapNav">打开高德导航</button>
            <small v-if="siteConfig.contact_map_note">{{ siteConfig.contact_map_note }}</small>
          </div>
        </div>
      </div>
      <div class="container">
        <ModuleRenderer :modules="normalModules" />
      </div>
    </section>
  </div>
</template>

<style scoped>
.contact-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 48px;
  align-items: start;
}

.contact-info h2 {
  color: var(--color-primary);
  font-size: 22px;
  margin-bottom: 24px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 20px;
}

.label {
  font-size: 13px;
  color: var(--color-text-light);
}

.info-item span:last-child {
  font-size: 15px;
}

.contact-btn {
  margin-top: 16px;
  padding: 12px 32px;
}
.map-card {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  height: 320px;
  overflow: hidden;
}

.map-card.clickable {
  cursor: pointer;
}

.map-iframe {
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
}

.map-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--color-text-light);
}

.map-placeholder p {
  font-size: 18px;
  margin-bottom: 8px;
}

.map-actions {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.map-actions small {
  color: #64748b;
  font-size: 12px;
}

@media (max-width: 768px) {
  .contact-grid {
    grid-template-columns: 1fr;
  }
}
</style>
