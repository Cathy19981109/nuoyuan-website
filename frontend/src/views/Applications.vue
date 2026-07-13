<script setup>
import { ref, onMounted } from 'vue'
import { getApplications, getPageModules } from '@/api'
import ModuleRenderer from '@/components/modules/ModuleRenderer.vue'

const applications = ref([])
const pageModules = ref([])
const loading = ref(true)

onMounted(async () => {
  try {
    applications.value = await getApplications()
    pageModules.value = await getPageModules('applications')
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <div class="page-banner">
      <div class="container">
        <h1>应用领域</h1>
        <p>基因编辑技术在各科研与产业领域的广泛应用</p>
      </div>
    </div>

    <section class="section">
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
        <div v-else class="empty">暂无应用领域数据</div>
      </div>
    </section>
    <ModuleRenderer :modules="pageModules" />
  </div>
</template>

<style scoped>
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
  margin: 0 auto;
}

.app-card h3 {
  font-size: 18px;
  color: var(--color-primary);
  margin-bottom: 8px;
}

.app-card p {
  font-size: 14px;
  color: var(--color-text-light);
  line-height: 1.7;
}
</style>
