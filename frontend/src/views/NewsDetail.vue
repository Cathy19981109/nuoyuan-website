<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getNewsById } from '@/api'
import { applySeoMeta } from '@/composables/useSeo'

const route = useRoute()
const news = ref(null)
const loading = ref(true)

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
      <div class="page-banner">
        <div class="container">
          <h1>{{ news.title }}</h1>
          <p>{{ news.author }} · {{ news.publish_time?.slice(0, 10) }}</p>
        </div>
      </div>
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

.content :deep(img) {
  max-width: 100%;
  border-radius: 8px;
  margin: 16px 0;
}

.back-link {
  display: inline-block;
  margin-top: 40px;
  color: var(--color-primary);
  font-size: 14px;
}

.back-link:hover {
  text-decoration: underline;
}
</style>
