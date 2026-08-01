<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { getNewsById } from '@/api'
import { applySeoMeta } from '@/composables/useSeo'
import CatalogHeroBanner from '@/components/catalog/CatalogHeroBanner.vue'
import PageBreadcrumb from '@/components/catalog/PageBreadcrumb.vue'
import { DEFAULT_CATALOG_BANNER } from '@/composables/useCatalogModules'

const route = useRoute()
const news = ref(null)
const loading = ref(true)

const bannerImage = computed(() => news.value?.cover_image || news.value?.banner_image || DEFAULT_CATALOG_BANNER)
const breadcrumbs = computed(() => {
  const items = [
    { label: '首页', to: '/' },
    { label: '新闻动态', to: '/news' },
  ]
  if (news.value?.title) items.push({ label: news.value.title })
  return items
})
const subtitle = computed(() => {
  if (!news.value) return ''
  const parts = [news.value.author, news.value.publish_time?.slice(0, 10)].filter(Boolean)
  return parts.join(' · ')
})

onMounted(async () => {
  try {
    news.value = await getNewsById(route.params.id)
    await applySeoMeta({ itemType: 'news', itemId: route.params.id })
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <div v-if="loading" class="loading">加载中...</div>
    <template v-else-if="news">
      <CatalogHeroBanner
        :title="news.title"
        :subtitle="subtitle"
        :background-image="bannerImage"
      />
      <PageBreadcrumb :items="breadcrumbs" />
      <section class="section">
        <div class="container article">
          <div class="content" v-html="news.content" />
          <router-link to="/news" class="back-link">← 返回新闻列表</router-link>
        </div>
      </section>
    </template>
    <div v-else class="empty">新闻不存在</div>
  </div>
</template>

<style scoped>
.article {
  max-width: 800px;
}

.content :deep(p) {
  margin-bottom: 16px;
  line-height: 1.9;
  font-size: 15px;
}

.back-link {
  display: inline-block;
  margin-top: 32px;
  color: var(--color-primary);
  font-size: 14px;
}
</style>
