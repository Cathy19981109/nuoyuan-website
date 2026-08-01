<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'
import { getNewsList, getPageModules } from '@/api'
import ModuleRenderer from '@/components/modules/ModuleRenderer.vue'
import CatalogHeroBanner from '@/components/catalog/CatalogHeroBanner.vue'
import PageBreadcrumb from '@/components/catalog/PageBreadcrumb.vue'
import { applySeoMeta } from '@/composables/useSeo'
import { useCatalogModules } from '@/composables/useCatalogModules'
import { useSectionAnchorNav } from '@/composables/useSectionAnchorNav'

const NEWS_SECTION_LIMIT = 5
const NAV_VISIBLE_TABS = 4

const newsList = ref([])
const loading = ref(true)
const pagination = ref({ page: 1, pageSize: 10, totalPages: 0 })
const pageModules = ref([])

const {
  bannerModule,
  bannerImage,
  normalModules,
} = useCatalogModules(pageModules, {
  bannerSystemKey: 'news_banner',
  bannerModuleName: '新闻页Banner模块',
})

const breadcrumbs = computed(() => [
  { label: '首页', to: '/' },
  { label: '新闻动态', to: '/news' },
])

const articleSections = computed(() => normalModules.value.slice(0, NEWS_SECTION_LIMIT))
const hasModules = computed(() => articleSections.value.length > 0)
const showEmptyPlaceholder = computed(() => !loading.value && !hasModules.value && !newsList.value.length)
const showNewsListSection = computed(() => loading.value || newsList.value.length > 0 || showEmptyPlaceholder.value)

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
  idPrefix: 'news-module',
  visibleTabs: NAV_VISIBLE_TABS,
})

function sectionLabel(row) {
  return String(row?.main_title || row?.module_name || '文章板块').trim()
}

async function loadNews(page = 1) {
  loading.value = true
  try {
    const params = { page, pageSize: pagination.value.pageSize }
    const data = await getNewsList(params)
    newsList.value = data.list || []
    pagination.value = { ...pagination.value, ...data.pagination }
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  pageModules.value = await getPageModules('news')
  await applySeoMeta({ pageKey: 'news' })
  await loadNews()
  await nextTick()
  syncTabsViewportWidth()
})
</script>

<template>
  <div class="news-page">
    <CatalogHeroBanner
      :title="bannerModule?.main_title || '新闻动态'"
      :subtitle="bannerModule?.body_text || '了解最新行业资讯与公司动态'"
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
      <div ref="articlesTopRef" id="news-articles-top" class="articles-anchor" />
      <ModuleRenderer :modules="articleSections" section-id-prefix="news-module" />
    </section>

    <section v-if="showNewsListSection" class="section news-list-section">
      <div class="container">
        <div v-if="loading" class="loading">加载中...</div>
        <div v-else-if="newsList.length" class="news-list">
          <router-link
            v-for="item in newsList"
            :key="item.id"
            :to="`/news/${item.id}`"
            class="news-row card"
          >
            <div class="news-info">
              <span v-if="item.is_top" class="top-tag">置顶</span>
              <h3>{{ item.title }}</h3>
              <p>{{ item.short_desc }}</p>
            </div>
            <div class="news-meta">
              <span>{{ item.publish_time?.slice(0, 10) }}</span>
            </div>
          </router-link>
        </div>
        <div v-else-if="showEmptyPlaceholder" class="empty">暂无新闻</div>

        <div v-if="pagination.totalPages > 1" class="pagination">
          <button :disabled="pagination.page <= 1" @click="loadNews(pagination.page - 1)">上一页</button>
          <span>{{ pagination.page }} / {{ pagination.totalPages }}</span>
          <button :disabled="pagination.page >= pagination.totalPages" @click="loadNews(pagination.page + 1)">下一页</button>
        </div>
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

.news-list-section {
  padding-top: 24px;
}

.news-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.news-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  gap: 24px;
}

.news-info h3 {
  font-size: 16px;
  color: var(--color-primary);
  margin-bottom: 6px;
}

.news-info p {
  font-size: 13px;
  color: var(--color-text-light);
}

.top-tag {
  display: inline-block;
  background: #fef3c7;
  color: #d97706;
  font-size: 12px;
  padding: 1px 8px;
  border-radius: 4px;
  margin-bottom: 6px;
}

.news-meta {
  flex-shrink: 0;
  font-size: 13px;
  color: var(--color-text-light);
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 32px;
}

.pagination button {
  padding: 8px 16px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-white);
  cursor: pointer;
}

.pagination button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .nav-inner { justify-content: flex-start; }
}
</style>
