<script setup>
import { ref, onMounted, computed } from 'vue'
import { getPageByNavName, getPageModules } from '@/api'
import ModuleRenderer from '@/components/modules/ModuleRenderer.vue'
import CatalogHeroBanner from '@/components/catalog/CatalogHeroBanner.vue'
import PageBreadcrumb from '@/components/catalog/PageBreadcrumb.vue'
import { applySeoMeta } from '@/composables/useSeo'
import { useCatalogModules } from '@/composables/useCatalogModules'

const page = ref(null)
const pageModules = ref([])
const loading = ref(true)

const {
  bannerModule,
  bannerImage,
  normalModules,
} = useCatalogModules(pageModules, {
  bannerSystemKey: 'about_banner',
  bannerModuleName: 'Banner模块',
})

const breadcrumbs = computed(() => [
  { label: '首页', to: '/' },
  { label: '关于我们', to: '/about' },
])

const hasModules = computed(() => (normalModules.value || []).length > 0)

onMounted(async () => {
  try {
    pageModules.value = await getPageModules('about')
  } catch {
    pageModules.value = []
  }
  try {
    // nav_name 存的是英文 key（about），不是中文标题
    page.value = await getPageByNavName('about')
  } catch {
    page.value = null
  }
  try {
    await applySeoMeta({ pageKey: 'about' })
  } catch {
    /* ignore */
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <CatalogHeroBanner
      :title="bannerModule?.main_title || '关于我们'"
      :subtitle="bannerModule?.body_text || '诺元智合 · 专注基因编辑与生命科学研究'"
      :background-image="bannerImage"
    />
    <PageBreadcrumb :items="breadcrumbs" />

    <section v-if="loading" class="section">
      <div class="container">
        <div class="loading">加载中...</div>
      </div>
    </section>

    <section v-else-if="hasModules" class="about-modules-section">
      <ModuleRenderer :modules="normalModules" :all-modules="pageModules" />
    </section>

    <section v-else class="section">
      <div class="container about">
        <div v-if="page?.content" class="content" v-html="page.content" />
        <div v-else class="default-content">
          <h2>公司简介</h2>
          <p>
            诺元智合（NUOYUAN BIOTECH）是一家专注于基因编辑核心服务与科研实验试剂的高新技术企业。
            我们致力于为生命科学研究机构、生物医药企业提供高品质的 RNA 合成、CRISPR/Cas9 技术服务、
            基因载体构建及分子生物学、细胞培养等科研试剂产品。
          </p>
          <h2>我们的使命</h2>
          <p>以技术创新驱动生命科学进步，为科研工作者提供可靠、高效的产品与服务。</p>
          <h2>核心优势</h2>
          <ul>
            <li>超长链 RNA 合成能力，最高可达 266nt</li>
            <li>CRISPR/Cas9 全套技术服务，编辑效率高、脱靶可控</li>
            <li>严格质控体系，批次稳定性强</li>
            <li>全程技术跟进，交付周期短</li>
          </ul>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.about {
  max-width: 900px;
}

.about-modules-section {
  padding: 24px 0 48px;
}

.default-content h2 {
  color: var(--color-primary);
  font-size: 20px;
  margin: 32px 0 12px;
}

.default-content h2:first-child {
  margin-top: 0;
}

.default-content p,
.content {
  color: var(--color-text);
  line-height: 1.8;
  font-size: 15px;
}

.default-content ul {
  margin: 12px 0 0 20px;
  color: var(--color-text);
  line-height: 1.9;
}
</style>
