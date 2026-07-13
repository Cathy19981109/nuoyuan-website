<script setup>
import { ref, onMounted } from 'vue'
import { getPageByNavName, getPageModules } from '@/api'
import ModuleRenderer from '@/components/modules/ModuleRenderer.vue'
import { applySeoMeta } from '@/composables/useSeo'

const page = ref(null)
const pageModules = ref([])
const loading = ref(true)

onMounted(async () => {
  try {
    page.value = await getPageByNavName('关于我们')
    pageModules.value = await getPageModules('about')
    await applySeoMeta({ pageKey: 'about' })
  } catch {
    page.value = null
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <div class="page-banner">
      <div class="container">
        <h1>关于我们</h1>
        <p>诺元智合 · 专注基因编辑与生命科学研究</p>
      </div>
    </div>
    <section class="section">
      <div class="container about">
        <div v-if="loading" class="loading">加载中...</div>
        <div v-else-if="page?.content" class="content" v-html="page.content" />
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
    <ModuleRenderer :modules="pageModules" />
  </div>
</template>

<style scoped>
.about {
  max-width: 900px;
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
.default-content li {
  color: var(--color-text-light);
  line-height: 1.9;
  font-size: 15px;
}

.default-content ul {
  padding-left: 20px;
}

.default-content li {
  margin-bottom: 8px;
}

.content :deep(p) {
  margin-bottom: 16px;
  line-height: 1.9;
}
</style>
