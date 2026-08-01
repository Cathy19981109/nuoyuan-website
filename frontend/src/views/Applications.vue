<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'
import { getApplications, getPageModules } from '@/api'
import ModuleRenderer from '@/components/modules/ModuleRenderer.vue'
import CatalogHeroBanner from '@/components/catalog/CatalogHeroBanner.vue'
import PageBreadcrumb from '@/components/catalog/PageBreadcrumb.vue'
import { applySeoMeta } from '@/composables/useSeo'
import { useCatalogModules } from '@/composables/useCatalogModules'
import { useSectionAnchorNav } from '@/composables/useSectionAnchorNav'

const SECTION_LIMIT = 5
const NAV_VISIBLE_TABS = 4

const applications = ref([])
const loading = ref(true)
const pageModules = ref([])

const {
  bannerModule,
  bannerImage,
  normalModules,
} = useCatalogModules(pageModules, {
  bannerSystemKey: 'applications_banner',
  bannerModuleName: '应用页Banner模块',
})

const breadcrumbs = computed(() => [
  { label: '首页', to: '/' },
  { label: '应用领域', to: '/applications' },
])

const articleSections = computed(() => normalModules.value.slice(0, SECTION_LIMIT))
const hasModules = computed(() => articleSections.value.length > 0)
const showEmptyPlaceholder = computed(() => !loading.value && !hasModules.value && !applications.value.length)
const showAppsListSection = computed(() => loading.value || applications.value.length > 0 || showEmptyPlaceholder.value)

const {
  activeSectionId,
  articlesTopRef,
  navRef,
  tabsTrackRef,
  canScrollLeft,
  canScrollRight,
  tabsViewportWidth,
  showNavArrows,
  scrollToAll,
  scrollToSection,
  scrollTabs,
  syncTabsViewportWidth,
} = useSectionAnchorNav(articleSections, {
  idPrefix: 'app-module',
  visibleTabs: NAV_VISIBLE_TABS,
})

function sectionLabel(row) {
  return String(row?.main_title || row?.module_name || '应用板块').trim()
}

onMounted(async () => {
  try {
    applications.value = await getApplications()
    pageModules.value = await getPageModules('applications')
    await applySeoMeta({ pageKey: 'applications' })
  } finally {
    loading.value = false
  }
  await nextTick()
  syncTabsViewportWidth()
})
</script>

<template>
  <div class="applications-page">
    <CatalogHeroBanner
      :title="bannerModule?.main_title || '应用领域'"
      :subtitle="bannerModule?.body_text || '基因编辑技术在各科研与产业领域的广泛应用'"
      :background-image="bannerImage"
    />
    <PageBreadcrumb :items="breadcrumbs" />

    <div v-if="hasModules" ref="navRef" class="section-nav">
      <div class="container nav-inner">
        <button
          type="button"
          class="tab tab-all"
          :class="{ active: activeSectionId == null }"
          @click="scrollToAll"
        >
          全部
        </button>

        <div class="tabs-scroll-wrap" :class="{ 'has-arrows': showNavArrows }">
          <button
            v-if="showNavArrows"
            type="button"
            class="nav-arrow"
            :disabled="!canScrollLeft"
            aria-label="向左查看更多"
            @click="scrollTabs(-1)"
          >
            ‹
          </button>

          <div
            ref="tabsTrackRef"
            class="tabs-track"
            :style="tabsViewportWidth ? { width: `${tabsViewportWidth}px`, maxWidth: `${tabsViewportWidth}px` } : undefined"
          >
            <button
              v-for="row in articleSections"
              :key="row.id"
              type="button"
              class="tab"
              :data-tab-id="row.id"
              :class="{ active: activeSectionId === row.id }"
              @click="scrollToSection(row)"
            >
              {{ sectionLabel(row) }}
            </button>
          </div>

          <button
            v-if="showNavArrows"
            type="button"
            class="nav-arrow"
            :disabled="!canScrollRight"
            aria-label="向右查看更多"
            @click="scrollTabs(1)"
          >
            ›
          </button>
        </div>
      </div>
    </div>

    <section v-if="hasModules" class="articles-section">
      <div ref="articlesTopRef" id="app-articles-top" class="articles-anchor" />
      <ModuleRenderer :modules="articleSections" section-id-prefix="app-module" />
    </section>

    <section v-if="showAppsListSection" class="section apps-list-section">
      <div class="container">
        <div v-if="loading" class="loading">加载中...</div>
        <div v-else-if="applications.length" class="card-grid">
          <router-link
            v-for="item in applications"
            :key="item.id"
            :to="`/applications/${item.id}`"
            class="app-card card"
          >
            <div class="app-icon">
              <img v-if="item.icon" :src="item.icon" :alt="item.name" />
              <span v-else>🔬</span>
            </div>
            <h3>{{ item.name }}</h3>
            <p>{{ item.description }}</p>
          </router-link>
        </div>
        <div v-else-if="showEmptyPlaceholder" class="empty">暂无应用领域数据</div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.section-nav {
  position: sticky;
  top: var(--header-height);
  z-index: 30;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--color-border);
  padding: 14px 0;
}

.nav-inner {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: center;
  min-width: 0;
}

.tab-all { flex-shrink: 0; }

.tabs-scroll-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.tabs-track {
  display: flex;
  flex-wrap: nowrap;
  gap: 10px;
  overflow-x: auto;
  overflow-y: hidden;
  scroll-behavior: smooth;
  scrollbar-width: none;
  -ms-overflow-style: none;
  -webkit-overflow-scrolling: touch;
  min-width: 0;
  padding: 2px 0;
  flex: 0 0 auto;
}

.tabs-scroll-wrap:not(.has-arrows) .tabs-track {
  overflow: visible;
  flex-wrap: wrap;
  justify-content: center;
  max-width: none;
  width: auto !important;
}

.tabs-track::-webkit-scrollbar { display: none; }

.tab {
  flex-shrink: 0;
  padding: 8px 20px;
  border: 1px solid var(--color-border);
  border-radius: 20px;
  background: var(--color-white);
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  color: var(--color-text);
  white-space: nowrap;
}

.tab:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.tab.active {
  background: var(--color-primary);
  color: var(--color-white);
  border-color: var(--color-primary);
}

.nav-arrow {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid var(--color-border);
  background: var(--color-white);
  color: var(--color-primary);
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.nav-arrow:hover:not(:disabled) {
  border-color: var(--color-primary);
  background: #f8fafc;
}

.nav-arrow:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.articles-anchor {
  height: 0;
  overflow: hidden;
}

.articles-section {
  padding: 8px 0 0;
}

.apps-list-section {
  padding-top: 24px;
}

.app-card {
  padding: 32px 24px;
  text-align: center;
  display: block;
}

.app-icon {
  font-size: 40px;
  margin-bottom: 16px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.app-icon img {
  width: 48px;
  height: 48px;
  object-fit: contain;
}

.app-card h3 {
  font-size: 16px;
  color: var(--color-primary);
  margin-bottom: 8px;
}

.app-card p {
  font-size: 13px;
  color: var(--color-text-light);
  line-height: 1.6;
}

@media (max-width: 640px) {
  .nav-inner { justify-content: flex-start; }
}
</style>
