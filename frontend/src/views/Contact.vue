<script setup>
import { computed, onMounted, ref } from 'vue'
import { getPageModules } from '@/api'
import ModuleRenderer from '@/components/modules/ModuleRenderer.vue'
import PageBreadcrumb from '@/components/catalog/PageBreadcrumb.vue'
import { applySeoMeta } from '@/composables/useSeo'
import { useCatalogModules } from '@/composables/useCatalogModules'
import contactIllustration from '@/assets/images/contact-support-illustration.png'
import { toPublicMediaUrl } from '@/utils/media'

const props = defineProps({
  siteConfig: { type: Object, default: () => ({}) },
})

const pageModules = ref([])

const { normalModules } = useCatalogModules(pageModules, {
  excludeSystemKeys: ['contact_info_block', 'contact_banner'],
})

const breadcrumbs = computed(() => [
  { label: '首页', to: '/' },
  { label: '联系我们', to: '/contact' },
])

const contactInfoModule = computed(() =>
  (pageModules.value || []).find((m) => String(m?.extra_json?.system_key || '') === 'contact_info_block') || null
)

function toPublicUrl(url) {
  return toPublicMediaUrl(url)
}

const contactInfo = computed(() => {
  const extra = contactInfoModule.value?.extra_json || {}
  return {
    title: String(contactInfoModule.value?.main_title || '').trim() || '联系方式',
    company_name: String(extra.company_name || '').trim() || '诺元智合 NUOYUAN BIOTECH',
    phone: String(extra.phone || '').trim(),
    email: String(extra.email || '').trim(),
    address: String(extra.address || '').trim(),
    wechat_qr: toPublicUrl(String(extra.wechat_qr || '').trim()),
  }
})

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
    <PageBreadcrumb :items="breadcrumbs" />
    <section class="section contact-section">
      <div class="container">
        <h2 class="contact-title">{{ contactInfo.title }}</h2>
        <div class="contact-panel">
          <div class="contact-info">
            <p class="contact-lead">感谢您对诺元智合的关注，如有任何问题欢迎联系我们</p>
            <div class="info-item">
              <span class="label">公司名称</span>
              <span>{{ contactInfo.company_name }}</span>
            </div>
            <div v-if="contactInfo.phone" class="info-item">
              <span class="label">联系电话</span>
              <span>{{ contactInfo.phone }}</span>
            </div>
            <div v-if="contactInfo.email" class="info-item">
              <span class="label">联系邮箱</span>
              <span>{{ contactInfo.email }}</span>
            </div>
            <div v-if="contactInfo.address" class="info-item">
              <span class="label">公司地址</span>
              <span>{{ contactInfo.address }}</span>
            </div>
            <div v-if="contactInfo.wechat_qr" class="info-item wechat-item">
              <span class="label">
                <svg class="wechat-icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M9.5 4C5.91 4 3 6.48 3 9.5c0 1.74.95 3.28 2.44 4.27l-.6 1.8 2.09-1.05c.74.22 1.53.34 2.35.34.23 0 .46-.01.68-.03A4.86 4.86 0 0 1 9.5 13c0-2.97 2.69-5.38 6-5.48C14.86 5.4 12.4 4 9.5 4zm-2.25 3.25a.88.88 0 1 1 0 1.75.88.88 0 0 1 0-1.75zm4.5 0a.88.88 0 1 1 0 1.75.88.88 0 0 1 0-1.75zM15.5 8.5c-2.76 0-5 1.9-5 4.25S12.74 17 15.5 17c.58 0 1.13-.09 1.64-.25l1.66.83-.48-1.43C19.4 15.34 20 14.12 20 12.75c0-2.35-2.24-4.25-4.5-4.25zm-1.75 2.5a.75.75 0 1 1 0 1.5.75.75 0 0 1 0-1.5zm3.5 0a.75.75 0 1 1 0 1.5.75.75 0 0 1 0-1.5z"
                  />
                </svg>
                微信
              </span>
              <div class="wechat-card">
                <img
                  class="wechat-qr"
                  :src="contactInfo.wechat_qr"
                  alt="微信二维码"
                />
                <span class="wechat-hint">扫码添加微信</span>
              </div>
            </div>
          </div>
          <div class="contact-visual" aria-hidden="true">
            <div class="visual-glow" />
            <img
              class="visual-img"
              :src="contactIllustration"
              alt=""
            />
          </div>
        </div>
      </div>
      <ModuleRenderer v-if="normalModules.length" :modules="normalModules" :all-modules="pageModules" />
    </section>
  </div>
</template>

<style scoped>
.contact-title {
  margin: 0 0 36px;
  font-size: 32px;
  font-weight: 700;
  text-align: center;
  color: var(--color-primary);
  line-height: 1.3;
}

.contact-panel {
  display: grid;
  grid-template-columns: 3fr 7fr;
  gap: 24px;
  align-items: stretch;
  margin-bottom: 8px;
  text-align: left;
}

.contact-info {
  min-width: 0;
}

.contact-lead {
  margin: 0 0 28px;
  font-size: 14px;
  line-height: 1.6;
  color: var(--color-text-light);
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 20px;
}

.info-item:last-child {
  margin-bottom: 0;
}

.label {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-primary);
  line-height: 1.4;
}

.info-item span:last-child {
  font-size: 14px;
  font-weight: 400;
  color: var(--color-text);
  line-height: 1.6;
}

.wechat-item {
  align-items: flex-start;
}

.wechat-item .label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.wechat-icon {
  width: 20px;
  height: 20px;
  color: #07c160;
  flex-shrink: 0;
}

.wechat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  align-self: flex-start;
  gap: 8px;
  margin-top: 4px;
}

.wechat-qr {
  width: 128px;
  height: 128px;
  object-fit: contain;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: #fff;
  padding: 6px;
}

.wechat-hint {
  font-size: 13px;
  color: var(--color-text-light);
  line-height: 1.4;
}

.contact-visual {
  position: relative;
  min-width: 0;
  width: 100%;
  /* 不参与撑高：行高由左侧文字决定，图片等比缩放到同高 */
  min-height: 0;
}

.visual-glow {
  position: absolute;
  inset: 6% 4%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(19, 64, 116, 0.1) 0%, rgba(19, 64, 116, 0.03) 55%, transparent 72%);
  pointer-events: none;
}

.visual-img {
  position: absolute;
  inset: 0;
  z-index: 1;
  width: 100%;
  height: 100%;
  display: block;
  object-fit: contain;
  object-position: right center;
  border-radius: 12px;
  animation: contact-float 5.5s ease-in-out infinite;
}

@keyframes contact-float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-6px);
  }
}

@media (max-width: 768px) {
  .contact-title {
    font-size: 26px;
    margin-bottom: 28px;
  }

  .contact-panel {
    grid-template-columns: 1fr;
    gap: 24px;
  }

  .contact-info {
    order: 1;
  }

  .contact-visual {
    order: 2;
    position: relative;
    height: auto;
    min-height: 200px;
  }

  .visual-img {
    position: relative;
    inset: auto;
    width: 100%;
    height: auto;
    max-height: 240px;
    object-position: center;
  }
}
</style>
