<script setup>
import { computed } from 'vue'
const props = defineProps({
  siteConfig: { type: Object, default: () => ({}) },
})
const footerBlocks = computed(() => props.siteConfig.footer_blocks || [])
const layoutClass = computed(() => {
  const maxCols = Math.max(...footerBlocks.value.map((b) => Number(b.layout_type || 1)), 3)
  return `cols-${Math.min(maxCols, 4)}`
})
</script>

<template>
  <footer class="footer">
    <div class="container">
      <div class="footer-grid" :class="layoutClass">
        <div class="footer-brand">
          <img
            v-if="siteConfig.brand_logo || siteConfig.site_logo"
            class="brand-logo"
            :src="siteConfig.brand_logo || siteConfig.site_logo"
            alt="品牌 Logo"
          />
          <div v-else class="brand-name">诺元智合</div>
          <p class="brand-desc">专注基因编辑核心服务与科研实验试剂，为生命科学研究提供高品质解决方案。</p>
        </div>
        <div class="footer-links">
          <h4>快速链接</h4>
          <router-link to="/products">产品中心</router-link>
          <router-link to="/services">技术服务</router-link>
          <router-link to="/applications">应用领域</router-link>
          <router-link to="/news">新闻动态</router-link>
        </div>
        <div class="footer-contact">
          <h4>联系我们</h4>
          <router-link to="/contact">查看联系方式</router-link>
          <p>请通过询价或联系页面与我们沟通</p>
        </div>
        <div v-for="block in footerBlocks" :key="block.id" class="footer-custom">
          <h4>{{ block.title }}</h4>
          <template v-if="block.links_json?.length">
            <a v-for="(link, idx) in block.links_json" :key="idx" :href="link.url || '#'" target="_blank">{{ link.text || '链接' }}</a>
          </template>
          <img v-if="block.qrcode_image" :src="block.qrcode_image" class="qrcode" />
        </div>
      </div>
      <div class="footer-bottom">
        <span>{{ siteConfig.footer_copyright || `© ${new Date().getFullYear()} 诺元智合 NUOYUAN BIOTECH. All rights reserved.` }}</span>
        <span v-if="siteConfig.icp_no" class="icp">{{ siteConfig.icp_no }}</span>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  background: var(--color-primary-dark);
  color: rgba(255, 255, 255, 0.85);
  padding: 56px 0 24px;
  margin-top: auto;
}
.footer-custom a {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  opacity: 0.8;
}
.qrcode {
  width: 96px;
  height: 96px;
  object-fit: cover;
  margin-top: 8px;
  border-radius: 6px;
}
.icp {
  display: inline-block;
  margin-left: 10px;
}
.footer-grid.cols-1 { grid-template-columns: 1fr; }
.footer-grid.cols-2 { grid-template-columns: 1fr 1fr; }
.footer-grid.cols-3 { grid-template-columns: 2fr 1fr 1fr; }
.footer-grid.cols-4 { grid-template-columns: 2fr 1fr 1fr 1fr; }

.footer-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 40px;
  margin-bottom: 40px;
}

.brand-logo {
  display: block;
  width: auto;
  height: auto;
  max-height: 48px;
  max-width: min(260px, 100%);
  object-fit: contain;
  object-position: left center;
  margin-bottom: 12px;
}

.brand-name {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 12px;
}

.brand-desc {
  font-size: 14px;
  line-height: 1.8;
  opacity: 0.75;
}

.footer-links h4,
.footer-contact h4 {
  font-size: 16px;
  margin-bottom: 16px;
  color: var(--color-white);
}

.footer-links a {
  display: block;
  font-size: 14px;
  margin-bottom: 10px;
  opacity: 0.75;
  transition: opacity 0.2s;
}

.footer-links a:hover {
  opacity: 1;
}

.footer-contact a {
  display: block;
  font-size: 14px;
  margin-bottom: 10px;
  opacity: 0.75;
  transition: opacity 0.2s;
}

.footer-contact a:hover {
  opacity: 1;
}

.footer-contact p {
  font-size: 14px;
  margin-bottom: 8px;
  opacity: 0.75;
}

.footer-bottom {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 24px;
  text-align: center;
  font-size: 13px;
  opacity: 0.6;
}

@media (max-width: 768px) {
  .footer-grid {
    grid-template-columns: 1fr;
    gap: 32px;
  }
}
</style>
