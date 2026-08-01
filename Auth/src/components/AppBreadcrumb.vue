<template>
  <nav class="breadcrumb-wrap" aria-label="面包屑">
    <template v-for="(item, idx) in crumbs" :key="`${item.label}-${idx}`">
      <span v-if="idx > 0" class="sep" aria-hidden="true">/</span>
      <button
        v-if="idx < crumbs.length - 1 && item.to"
        type="button"
        class="crumb-btn"
        @click="router.push(item.to)"
      >
        {{ item.label }}
      </button>
      <span v-else class="crumb-current">{{ item.label }}</span>
    </template>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const crumbs = computed(() => {
  const list = Array.isArray(route.meta?.breadcrumbs) ? route.meta.breadcrumbs : []
  if (list.length) return list
  return [{ label: route.meta?.title || '当前页面', to: route.fullPath }]
})
</script>

<style scoped>
.breadcrumb-wrap {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0;
  width: 100%;
  line-height: 1.5;
  letter-spacing: normal;
  white-space: normal;
}
.crumb-btn {
  border: none;
  background: transparent;
  color: #64748b;
  font-size: 13px;
  font-family: inherit;
  line-height: 1.5;
  letter-spacing: normal;
  cursor: pointer;
  padding: 0;
}
.crumb-btn:hover {
  color: #2563eb;
}
.crumb-current {
  color: #0f172a;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.5;
  letter-spacing: normal;
}
.sep {
  color: #94a3b8;
  font-size: 12px;
  line-height: 1.5;
  user-select: none;
}
</style>
