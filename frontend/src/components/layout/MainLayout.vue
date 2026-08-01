<script setup>
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getNav, getConfig } from '@/api'
import AppHeader from './AppHeader.vue'
import AppFooter from './AppFooter.vue'
import InquiryDialog from '../InquiryDialog.vue'
import { applySeoMeta } from '@/composables/useSeo'
import { applyFavicon } from '@/utils/favicon'

const route = useRoute()
const router = useRouter()
const navList = ref([])
const siteConfig = ref({})
const showInquiry = ref(false)
const inquiryProduct = ref(null)

const isPreviewMode = computed(() => {
  const q = route.query?.preview
  return q === '1' || q === 'true' || q === 'yes'
})

const isSiteOpen = computed(() => {
  const v = String(siteConfig.value?.site_public_open ?? '0').trim()
  return v === '1' || v === 'true' || v === 'yes' || v === 'on'
})

const showComingSoon = computed(() => !isSiteOpen.value && !isPreviewMode.value)

async function loadData() {
  try {
    const [nav, config] = await Promise.all([getNav(), getConfig()])
    navList.value = nav || []
    siteConfig.value = config || {}
    applyFavicon(config?.icon_logo || config?.brand_logo || '/favicon.png')
    if (!showComingSoon.value) {
      applySeoMeta({ pageKey: 'home' })
    } else {
      document.title = '即将上线'
    }
  } catch (err) {
    console.error('加载站点数据失败:', err.message)
  }
}

function openInquiry(product = null) {
  inquiryProduct.value = product
  showInquiry.value = true
}

function handleInquiryEvent(e) {
  openInquiry(e.detail || null)
}

function onPreviewGuard(e) {
  if (!isPreviewMode.value) return
  // 允许页面滚动，拦截点击/提交等交互
  const t = e.target
  if (!(t instanceof Element)) return
  if (t.closest('.preview-mode-banner')) return
  e.preventDefault()
  e.stopPropagation()
}

function exitPreview() {
  const query = { ...route.query }
  delete query.preview
  router.replace({ path: route.path, query })
}

onMounted(() => {
  loadData()
  window.addEventListener('open-inquiry', handleInquiryEvent)
})

onBeforeUnmount(() => {
  window.removeEventListener('open-inquiry', handleInquiryEvent)
})

watch(
  isPreviewMode,
  (on) => {
    document.body.classList.toggle('is-site-preview', on)
  },
  { immediate: true }
)

defineExpose({ openInquiry })
</script>

<template>
  <div class="layout" :class="{ 'is-preview': isPreviewMode }">
    <div v-if="showComingSoon" class="coming-soon">
      <div class="coming-card">
        <img
          v-if="siteConfig.brand_logo || siteConfig.site_logo"
          class="coming-logo"
          :src="siteConfig.brand_logo || siteConfig.site_logo"
          alt="品牌 Logo"
        />
        <h1>即将上线</h1>
        <p>网站内容筹备中，开放后即可访问。如需预览请联系管理员。</p>
      </div>
    </div>

    <template v-else>
      <div v-if="isPreviewMode" class="preview-mode-banner">
        <span>预览模式：网站尚未对外开放，当前仅供内部查看效果</span>
        <button type="button" class="preview-exit" @click="exitPreview">退出预览</button>
      </div>

      <div
        class="preview-shell"
        :class="{ 'preview-locked': isPreviewMode }"
        @click.capture="onPreviewGuard"
        @submit.capture="onPreviewGuard"
      >
        <AppHeader
          :nav-list="navList"
          :site-config="siteConfig"
          @open-inquiry="openInquiry()"
        />
        <main class="main">
          <router-view v-slot="{ Component }">
            <component :is="Component" :site-config="siteConfig" @open-inquiry="openInquiry" />
          </router-view>
        </main>
        <AppFooter :site-config="siteConfig" />
      </div>

      <InquiryDialog
        v-model="showInquiry"
        :product="inquiryProduct"
      />
    </template>
  </div>
</template>

<style scoped>
.layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main {
  flex: 1;
  padding-top: var(--header-height);
}

.layout.is-preview {
  --preview-banner-h: 40px;
}

.layout.is-preview .main {
  padding-top: calc(var(--header-height) + var(--preview-banner-h));
}

.layout.is-preview :deep(.header) {
  top: var(--preview-banner-h);
}

.layout.is-preview :deep(.section-nav) {
  top: calc(var(--header-height) + var(--preview-banner-h));
}

.preview-mode-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10000;
  height: var(--preview-banner-h, 40px);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 0 16px;
  background: #0b2d5c;
  color: #fff;
  font-size: 13px;
}

.preview-exit {
  border: 1px solid rgba(255, 255, 255, 0.45);
  background: transparent;
  color: #fff;
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 12px;
  cursor: pointer;
}

.preview-exit:hover {
  background: rgba(255, 255, 255, 0.12);
}

.preview-shell.preview-locked :deep(a),
.preview-shell.preview-locked :deep(button),
.preview-shell.preview-locked :deep(input),
.preview-shell.preview-locked :deep(select),
.preview-shell.preview-locked :deep(textarea),
.preview-shell.preview-locked :deep([role='button']) {
  pointer-events: none;
}

.coming-soon {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 40px 20px;
  background:
    radial-gradient(ellipse at top, rgba(11, 45, 92, 0.12), transparent 55%),
    linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%);
}

.coming-card {
  max-width: 520px;
  text-align: center;
}

.coming-logo {
  display: block;
  height: 56px;
  width: auto;
  margin: 0 auto 28px;
  object-fit: contain;
}

.coming-card h1 {
  margin: 0 0 12px;
  font-size: 36px;
  color: #0b2d5c;
}

.coming-card p {
  margin: 0;
  color: #64748b;
  font-size: 15px;
  line-height: 1.7;
}
</style>
