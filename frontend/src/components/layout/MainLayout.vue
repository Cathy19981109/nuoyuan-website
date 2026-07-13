<script setup>
import { ref, onMounted } from 'vue'
import { getNav, getConfig } from '@/api'
import AppHeader from './AppHeader.vue'
import AppFooter from './AppFooter.vue'
import InquiryDialog from '../InquiryDialog.vue'
import { applySeoMeta } from '@/composables/useSeo'

const navList = ref([])
const siteConfig = ref({})
const showInquiry = ref(false)
const inquiryProduct = ref(null)

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

onMounted(() => {
  loadData()
  window.addEventListener('open-inquiry', handleInquiryEvent)
})

defineExpose({ openInquiry })
</script>

<template>
  <div class="layout">
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
</style>
