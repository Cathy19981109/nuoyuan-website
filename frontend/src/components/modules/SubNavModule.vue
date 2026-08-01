<script setup>
import { computed } from 'vue'
import ModuleRenderer from './ModuleRenderer.vue'
import { useSectionAnchorNav } from '@/composables/useSectionAnchorNav'

const props = defineProps({
  parent: { type: Object, default: null },
  children: { type: Array, default: () => [] },
  sectionIdPrefix: { type: String, default: 'subnav' },
})

const articleSections = computed(() => props.children || [])

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
} = useSectionAnchorNav(articleSections, {
  idPrefix: props.sectionIdPrefix,
  visibleTabsDesktop: 4,
  visibleTabsMobile: 2,
  mobileBreakpoint: 768,
})

const hasChildren = computed(() => articleSections.value.length > 0)

const activeSectionLabel = computed(() => {
  if (activeSectionId.value == null) return '全部'
  const row = articleSections.value.find((item) => item.id === activeSectionId.value)
  return sectionLabel(row)
})

function sectionLabel(row) {
  return String(row?.main_title || row?.module_name || '板块').trim()
}
</script>

<template>
  <div v-if="hasChildren" class="sub-nav-module">
    <div ref="navRef" class="section-nav">
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
              :title="sectionLabel(row)"
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

      <div class="container current-section" aria-live="polite">
        当前：<strong>{{ activeSectionLabel }}</strong>
      </div>
    </div>

    <section class="articles-section">
      <div ref="articlesTopRef" class="articles-anchor" />
      <ModuleRenderer
        :modules="articleSections"
        :section-id-prefix="sectionIdPrefix"
      />
    </section>
  </div>
</template>

<style scoped>
.section-nav {
  position: sticky;
  top: var(--header-height);
  z-index: 30;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--color-border);
  padding: 12px 0 10px;
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
}

.nav-inner {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
  min-width: 0;
  width: 100%;
  max-width: 100%;
}

.tab-all { flex-shrink: 0; }

.tabs-scroll-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  flex: 1 1 auto;
  max-width: 100%;
}

.tabs-scroll-wrap.has-arrows {
  justify-content: center;
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
  font-weight: 500;
  transition: all 0.2s;
  color: var(--color-text);
  white-space: nowrap;
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tab:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.tab.active {
  background: var(--color-primary);
  color: var(--color-white);
  border-color: var(--color-primary);
  font-weight: 700;
  box-shadow: 0 2px 10px rgba(11, 45, 92, 0.22);
}

.nav-arrow {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid var(--color-primary);
  background: var(--color-white);
  color: var(--color-primary);
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.08);
}

.nav-arrow:hover:not(:disabled) {
  border-color: var(--color-primary);
  background: #eff6ff;
}

.nav-arrow:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  border-color: #94a3b8;
  color: #94a3b8;
}

.current-section {
  margin-top: 8px;
  font-size: 13px;
  color: #64748b;
  text-align: center;
  line-height: 1.4;
}

.current-section strong {
  color: var(--color-primary);
  font-weight: 700;
}

.articles-anchor {
  height: 0;
  overflow: hidden;
}

.articles-section {
  padding: 8px 0 0;
}

@media (max-width: 768px) {
  .section-nav {
    padding: 10px 0 8px;
  }

  .nav-inner {
    justify-content: flex-start;
    gap: 6px;
  }

  .tab-all {
    padding: 8px 12px;
    font-size: 13px;
  }

  .tab {
    padding: 8px 12px;
    font-size: 13px;
    max-width: min(38vw, 148px);
  }

  .nav-arrow {
    width: 40px;
    height: 40px;
    font-size: 24px;
  }

  .current-section {
    margin-top: 6px;
    font-size: 14px;
    text-align: left;
  }
}

@media (max-width: 430px) {
  .tab {
    max-width: min(36vw, 132px);
    min-height: 40px;
  }

  .current-section {
    font-size: 15px;
  }
}
</style>
