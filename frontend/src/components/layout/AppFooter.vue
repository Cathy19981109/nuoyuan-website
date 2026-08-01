<script setup>
import { computed } from 'vue'

const props = defineProps({
  siteConfig: { type: Object, default: () => ({}) },
})

const footerBlocks = computed(() =>
  (props.siteConfig.footer_blocks || []).filter((b) => Number(b.status) !== 0)
)

const copyrightText = computed(() =>
  String(props.siteConfig.footer_copyright || '').trim()
  || `© ${new Date().getFullYear()} 诺元智合 NUOYUAN BIOTECH. All rights reserved.`
)

const icpNo = computed(() => String(props.siteConfig.icp_no || '').trim())
const policeBeian = computed(() => String(props.siteConfig.footer_police_beian || '').trim())
const licenseText = computed(() => String(props.siteConfig.footer_license_text || '').trim())
const licenseUrl = computed(() => String(props.siteConfig.footer_license_url || '').trim())
const regionNote = computed(() => String(props.siteConfig.footer_region_note || '').trim())

const gridClass = computed(() => {
  const n = footerBlocks.value.length
  if (n <= 0) return 'cols-brand-only'
  if (n === 1) return 'cols-2'
  if (n === 2) return 'cols-3'
  if (n === 3) return 'cols-4'
  return 'cols-auto'
})

function isExternal(url) {
  return /^https?:\/\//i.test(String(url || ''))
}
</script>

<template>
  <footer class="footer">
    <div class="container">
      <div class="footer-grid" :class="gridClass">
        <div class="footer-brand">
          <img
            v-if="siteConfig.brand_logo || siteConfig.site_logo"
            class="brand-logo"
            :src="siteConfig.brand_logo || siteConfig.site_logo"
            alt="品牌 Logo"
          />
          <div v-else class="brand-name">诺元智合</div>
        </div>

        <template v-if="footerBlocks.length">
          <div
            v-for="block in footerBlocks"
            :key="block.id"
            class="footer-col"
          >
            <h4>{{ block.title }}</h4>
            <template v-if="block.links_json?.length">
              <template v-for="(link, idx) in block.links_json" :key="idx">
                <a
                  v-if="isExternal(link.url)"
                  :href="link.url || '#'"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {{ link.text || '链接' }}
                </a>
                <router-link v-else :to="link.url || '/'">
                  {{ link.text || '链接' }}
                </router-link>
              </template>
            </template>
          </div>
        </template>

        <template v-else>
          <div class="footer-col">
            <h4>快速链接</h4>
            <router-link to="/products">产品中心</router-link>
            <router-link to="/services">技术服务</router-link>
            <router-link to="/applications">应用领域</router-link>
            <router-link to="/news">新闻动态</router-link>
          </div>
          <div class="footer-col">
            <h4>联系我们</h4>
            <router-link to="/contact">查看联系方式</router-link>
            <p class="col-note">请通过询价或联系页面与我们沟通</p>
          </div>
        </template>
      </div>

      <div class="footer-bottom">
        <div class="legal-meta">
          <span>{{ copyrightText }}</span>
          <a
            v-if="licenseText"
            class="legal-link"
            :href="licenseUrl || '#'"
            :target="licenseUrl ? '_blank' : undefined"
            :rel="licenseUrl ? 'noopener noreferrer' : undefined"
          >
            {{ licenseText }}
          </a>
          <a
            v-if="icpNo"
            class="legal-link"
            href="https://beian.miit.gov.cn/"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ icpNo }}
          </a>
          <a
            v-if="policeBeian"
            class="legal-link"
            href="https://beian.mps.gov.cn/"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ policeBeian }}
          </a>
          <span v-if="regionNote">{{ regionNote }}</span>
        </div>
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

.footer-grid {
  display: grid;
  gap: 40px;
  margin-bottom: 40px;
}

.footer-grid.cols-brand-only {
  grid-template-columns: 1fr;
}

.footer-grid.cols-2 {
  grid-template-columns: 1.4fr 1fr;
}

.footer-grid.cols-3 {
  grid-template-columns: 1.4fr 1fr 1fr;
}

.footer-grid.cols-4 {
  grid-template-columns: 1.4fr repeat(3, 1fr);
}

.footer-grid.cols-auto {
  grid-template-columns: minmax(200px, 1.4fr) repeat(auto-fit, minmax(140px, 1fr));
}

.brand-logo {
  display: block;
  height: 48px;
  width: auto;
  max-width: min(300px, 100%);
  object-fit: contain;
  object-position: left center;
  margin-bottom: 12px;
}

.brand-name {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 0;
  color: #fff;
}

.footer-col h4 {
  font-size: 16px;
  margin: 0 0 16px;
  color: var(--color-white);
  font-weight: 600;
}

.footer-col a {
  display: block;
  font-size: 14px;
  margin-bottom: 10px;
  opacity: 0.75;
  transition: opacity 0.2s;
  color: inherit;
  text-decoration: none;
}

.footer-col a:hover {
  opacity: 1;
}

.col-note {
  font-size: 13px;
  line-height: 1.7;
  opacity: 0.7;
  margin: 0;
}

.footer-bottom {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 22px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.legal-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 8px 14px;
  font-size: 12px;
  line-height: 1.6;
  opacity: 0.72;
  text-align: center;
  max-width: 100%;
}

.legal-link {
  color: inherit;
  text-decoration: none;
}

.legal-link:hover {
  text-decoration: underline;
  opacity: 1;
}

@media (max-width: 900px) {
  .footer-grid.cols-3,
  .footer-grid.cols-4,
  .footer-grid.cols-auto {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 640px) {
  .footer-grid,
  .footer-grid.cols-2,
  .footer-grid.cols-3,
  .footer-grid.cols-4,
  .footer-grid.cols-auto {
    grid-template-columns: 1fr;
    gap: 28px;
  }
}
</style>
