<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { searchSite } from '@/api'

const route = useRoute()
const results = ref({ products: [], news: [], pages: [] })
const loading = ref(false)
const keyword = ref('')

async function doSearch(kw) {
  if (!kw.trim()) return
  loading.value = true
  try {
    results.value = await searchSite(kw.trim())
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  keyword.value = route.query.keyword || ''
  if (keyword.value) doSearch(keyword.value)
})

watch(
  () => route.query.keyword,
  (kw) => {
    keyword.value = kw || ''
    if (kw) doSearch(kw)
  }
)
</script>

<template>
  <div>
    <div class="page-banner">
      <div class="container">
        <h1>搜索结果</h1>
        <p v-if="keyword">关键词：{{ keyword }}</p>
      </div>
    </div>
    <section class="section">
      <div class="container">
        <div v-if="loading" class="loading">搜索中...</div>
        <div v-else-if="!keyword" class="empty">请输入搜索关键词</div>
        <div v-else class="results">
          <div v-if="results.products?.length" class="result-group">
            <h2>产品 ({{ results.products.length }})</h2>
            <div class="result-list">
              <router-link
                v-for="item in results.products"
                :key="'p' + item.id"
                :to="`/products/${item.id}`"
                class="result-item"
              >
                <h3>{{ item.name }}</h3>
                <p>{{ item.short_desc }}</p>
              </router-link>
            </div>
          </div>
          <div v-if="results.news?.length" class="result-group">
            <h2>新闻 ({{ results.news.length }})</h2>
            <div class="result-list">
              <router-link
                v-for="item in results.news"
                :key="'n' + item.id"
                :to="`/news/${item.id}`"
                class="result-item"
              >
                <h3>{{ item.title }}</h3>
                <p>{{ item.short_desc }}</p>
              </router-link>
            </div>
          </div>
          <div v-if="results.pages?.length" class="result-group">
            <h2>页面 ({{ results.pages.length }})</h2>
            <div class="result-list">
              <div v-for="item in results.pages" :key="'pg' + item.id" class="result-item">
                <h3>{{ item.title }}</h3>
                <p>{{ item.nav_name }}</p>
              </div>
            </div>
          </div>
          <div
            v-if="!results.products?.length && !results.news?.length && !results.pages?.length"
            class="empty"
          >
            未找到与「{{ keyword }}」相关的内容
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.result-group {
  margin-bottom: 40px;
}

.result-group h2 {
  font-size: 18px;
  color: var(--color-primary);
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--color-border);
}

.result-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.result-item {
  display: block;
  padding: 16px 20px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  transition: box-shadow 0.2s;
}

.result-item:hover {
  box-shadow: var(--shadow-sm);
}

.result-item h3 {
  font-size: 15px;
  color: var(--color-primary);
  margin-bottom: 4px;
}

.result-item p {
  font-size: 13px;
  color: var(--color-text-light);
}
</style>
