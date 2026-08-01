<script setup>
import { computed } from 'vue'
import ModuleRenderer from './ModuleRenderer.vue'
import { useSectionAnchorNav } from '@/composables/useSectionAnchorNav'

const props = defineProps({
  parent: { type: Object, default: null },
  children: { type: Array, default: () => [] },
  sectionIdPrefix: { type: String, default: 'subnav' },
})

const NAV_VISIBLE_TABS = 4

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
  visibleTabs: NAV_VISIBLE_TABS,
})

const hasChildren = computed(() => articleSections.value.length > 0)

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

@media (max-width: 640px) {
  .nav-inner { justify-content: flex-start; }
}
</style>
