<script setup>
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getNav, getConfig } from '@/api'
import AppHeader from './AppHeader.vue'
import AppFooter from './AppFooter.vue'
import InquiryDialog from '../InquiryDialog.vue'
import { applySeoMeta } from '@/composables/useSeo'

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

async function loadData() {
  try {
    const [nav, config] = await Promise.all([getNav(), getConfig()])
    navList.value = nav || []
    siteConfig.value = config || {}
    applySeoMeta({ pageKey: 'home' })
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
    <div v-if="isPreviewMode" class="preview-mode-banner">
      <span>预览模式：仅展示更新后的页面效果，功能不可交互</span>
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
</style>
