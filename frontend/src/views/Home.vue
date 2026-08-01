<script setup>
import { ref, onMounted } from 'vue'
import { getProducts, getNewsList, getPageModules } from '@/api'
import ProductCard from '@/components/ProductCard.vue'
import ModuleRenderer from '@/components/modules/ModuleRenderer.vue'
import { applySeoMeta } from '@/composables/useSeo'

defineProps({
  siteConfig: { type: Object, default: () => ({}) },
})

defineEmits(['open-inquiry'])

const hotProducts = ref([])
const latestNews = ref([])
const pageModules = ref([])
const loading = ref(true)

onMounted(async () => {
  try {
    const [products, news] = await Promise.all([
      getProducts({ isHot: 1, pageSize: 6 }),
      getNewsList({ pageSize: 3 }),
    ])
    pageModules.value = await getPageModules('home')
    await applySeoMeta({ pageKey: 'home' })
    hotProducts.value = products.list || []
    latestNews.value = news.list || []
  } catch (err) {
    console.error(err.message)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="home">
    <section class="hero">
      <div class="container hero-content">
        <h1>诺元智合</h1>
        <p class="hero-en">NUOYUAN BIOTECH</p>
        <p class="hero-desc">专注基因编辑核心服务与科研实验试剂，为生命科学研究提供高品质解决方案</p>
        <div class="hero-actions">
          <router-link to="/products" class="btn btn-primary">探索产品</router-link>
          <router-link to="/services" class="btn btn-outline hero-outline">技术服务</router-link>
        </div>
      </div>
    </section>

    <section class="section services-section">
      <div class="container">
        <h2 class="section-title">基因编辑核心服务</h2>
        <p class="section-subtitle">核心主打业务，覆盖 RNA 合成、CRISPR/Cas9 全套技术服务、基因与载体构建</p>
        <div v-if="loading" class="loading">加载中...</div>
        <div v-else-if="hotProducts.length" class="card-grid">
          <ProductCard
            v-for="item in hotProducts"
            :key="item.id"
            :product="item"
            @open-inquiry="$emit('open-inquiry', $event)"
          />
        </div>
        <div v-else class="empty">暂无产品数据</div>
        <div class="section-action">
          <router-link to="/products" class="btn btn-primary">查看全部产品</router-link>
        </div>
      </div>
    </section>

    <section class="section advantages">
      <div class="container">
        <h2 class="section-title">核心优势</h2>
        <div class="advantage-grid">
          <div class="advantage-item">
            <div class="advantage-icon">🧬</div>
            <h3>超长片段合成</h3>
            <p>可实现长达 266nt 超长链 RNA 合成，覆盖多种基因编辑体系</p>
          </div>
          <div class="advantage-item">
            <div class="advantage-icon">✅</div>
            <h3>编辑效率高</h3>
            <p>产品纯度高、脱靶率低、细胞毒性低，批次稳定性强</p>
          </div>
          <div class="advantage-item">
            <div class="advantage-icon">🔬</div>
            <h3>质控严格</h3>
            <p>全程技术跟进，实验重复性强，满足科研与转化研究需求</p>
          </div>
          <div class="advantage-item">
            <div class="advantage-icon">⚡</div>
            <h3>交付周期短</h3>
            <p>序列零误差、成功率高、交付快，可定制复杂载体</p>
          </div>
        </div>
      </div>
    </section>

    <section class="section news-section">
      <div class="container">
        <h2 class="section-title">新闻动态</h2>
        <p class="section-subtitle">了解最新行业资讯与公司动态</p>
        <div v-if="latestNews.length" class="news-grid">
          <router-link
            v-for="item in latestNews"
            :key="item.id"
            :to="`/news/${item.id}`"
            class="news-item card"
          >
            <div class="news-date">{{ item.publish_time?.slice(0, 10) }}</div>
            <h3>{{ item.title }}</h3>
            <p>{{ item.short_desc }}</p>
          </router-link>
        </div>
        <div v-else class="empty">暂无新闻</div>
        <div class="section-action">
          <router-link to="/news" class="btn btn-primary">查看更多新闻</router-link>
        </div>
      </div>
    </section>
    <ModuleRenderer :modules="pageModules" />
  </div>
</template>

<style scoped>
.home :deep(.section-title),
.home :deep(.section-subtitle) {
  text-align: left;
}

.hero {
  position: relative;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  color: var(--color-white);
  padding: 80px 0 100px;
  text-align: left;
  overflow: hidden;
}

.hero-content {
  position: relative;
  z-index: 1;
  max-width: 640px;
}

.hero h1 {
  font-size: 48px;
  font-weight: 700;
  margin-bottom: 8px;
}

.hero-en {
  font-size: 14px;
  letter-spacing: 4px;
  opacity: 0.7;
  margin-bottom: 24px;
}

.hero-desc {
  font-size: 18px;
  opacity: 0.9;
  max-width: 640px;
  margin: 0 0 36px;
  line-height: 1.8;
}

.hero-actions {
  display: flex;
  gap: 16px;
  justify-content: flex-start;
  flex-wrap: wrap;
}

.hero-outline {
  border-color: rgba(255, 255, 255, 0.8);
}

.services-section {
  background: var(--color-bg);
}

.services-section .section-title,
.services-section .section-subtitle,
.advantages .section-title,
.news-section .section-title,
.news-section .section-subtitle {
  text-align: left;
}

.section-action {
  text-align: left;
  margin-top: 40px;
}

.advantages {
  background: var(--color-white);
}

.advantage-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

.advantage-item {
  text-align: left;
  padding: 32px 20px;
  border-radius: 12px;
  border: 1px solid var(--color-border);
  transition: box-shadow 0.2s;
}

.advantage-item:hover {
  box-shadow: var(--shadow-md);
}

.advantage-icon {
  font-size: 36px;
  margin-bottom: 16px;
}

.advantage-item h3 {
  font-size: 16px;
  color: var(--color-primary);
  margin-bottom: 8px;
}

.advantage-item p {
  font-size: 13px;
  color: var(--color-text-light);
  line-height: 1.7;
}

.news-section {
  background: var(--color-bg);
}

.news-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.news-item {
  padding: 24px;
  display: block;
  text-align: left;
}

.news-date {
  font-size: 13px;
  color: var(--color-accent);
  margin-bottom: 8px;
}

.news-item h3 {
  font-size: 16px;
  color: var(--color-primary);
  margin-bottom: 8px;
}

.news-item p {
  font-size: 13px;
  color: var(--color-text-light);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.home :deep(.dynamic-module .text-box) {
  text-align: left;
}

@media (max-width: 1024px) {
  .advantage-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .news-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .hero h1 {
    font-size: 32px;
  }

  .hero-actions {
    flex-direction: column;
    align-items: flex-start;
  }

  .advantage-grid {
    grid-template-columns: 1fr;
  }
}
</style>
