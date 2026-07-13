<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getApplicationById } from '@/api'

defineEmits(['open-inquiry'])

const route = useRoute()
const application = ref(null)
const loading = ref(true)

onMounted(async () => {
  try {
    application.value = await getApplicationById(route.params.id)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <div v-if="loading" class="loading">加载中...</div>
    <template v-else-if="application">
      <div class="page-banner">
        <div class="container">
          <h1>{{ application.name }}</h1>
          <p>{{ application.description }}</p>
        </div>
      </div>
      <section class="section">
        <div class="container detail">
          <div v-if="application.content" class="content" v-html="application.content" />
          <div v-else class="empty-content">
            <p>{{ application.description || '暂无详细内容' }}</p>
          </div>
          <button class="btn btn-primary" @click="$emit('open-inquiry')">咨询此领域服务</button>
        </div>
      </section>
    </template>
    <div v-else class="empty">应用领域不存在</div>
  </div>
</template>

<style scoped>
.detail {
  max-width: 900px;
}

.content :deep(p) {
  margin-bottom: 16px;
  line-height: 1.8;
}

.empty-content {
  margin-bottom: 32px;
  color: var(--color-text-light);
  line-height: 1.8;
}
</style>
