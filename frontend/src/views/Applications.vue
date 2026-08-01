<script setup>
import { ref, onMounted, computed } from 'vue'
import { getApplications, getPageModules } from '@/api'
import ModuleRenderer from '@/components/modules/ModuleRenderer.vue'
import CatalogHeroBanner from '@/components/catalog/CatalogHeroBanner.vue'
import PageBreadcrumb from '@/components/catalog/PageBreadcrumb.vue'
import { applySeoMeta } from '@/composables/useSeo'
import { useCatalogModules } from '@/composables/useCatalogModules'

const applications = ref([])
const loading = ref(true)
const pageModules = ref([])

const {
  bannerModule,
  bannerImage,
  normalModules,
} = useCatalogModules(pageModules, {
  bannerSystemKey: 'applications_banner',
  bannerModuleName: 'Banner模块',
})

const breadcrumbs = computed(() => [
  { label: '首页', to: '/' },
  { label: '应用领域', to: '/applications' },
])

const topLevelModules = computed(() =>
  (normalModules.value || []).filter((m) => Number(m.parent_id || 0) === 0)
)
const hasModules = computed(() => topLevelModules.value.length > 0)
const showEmptyPlaceholder = computed(() => !loading.value && !hasModules.value && !applications.value.length)
const showAppsListSection = computed(() => loading.value || applications.value.length > 0 || showEmptyPlaceholder.value)

onMounted(async () => {
  try {
    applications.value = await getApplications()
    pageModules.value = await getPageModules('applications')
    await applySeoMeta({ pageKey: 'applications' })
  } finally {
    loading.value = false
  }
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

    <section v-if="hasModules" class="articles-section">
      <ModuleRenderer
        :modules="topLevelModules"
        :all-modules="pageModules"
        section-id-prefix="app-module"
      />
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
</style>
