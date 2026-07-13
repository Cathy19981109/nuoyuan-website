<template>
  <div class="breadcrumb-wrap">
    <button
      v-for="(item, idx) in crumbs"
      :key="`${item.label}-${idx}`"
      class="crumb-btn"
      :class="{ current: idx === crumbs.length - 1 }"
      @click="go(item, idx)"
    >
      <span>{{ item.label }}</span>
      <span v-if="idx < crumbs.length - 1" class="sep">></span>
    </button>
  </div>
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

function go(item, idx) {
  if (idx === crumbs.value.length - 1) return
  if (item.to) router.push(item.to)
}
</script>

<style scoped>
.breadcrumb-wrap {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 12px;
}
.crumb-btn {
  border: none;
  background: transparent;
  color: #64748b;
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  padding: 2px 0;
}
.crumb-btn.current {
  color: #0f172a;
  font-weight: 600;
  cursor: default;
}
.sep {
  color: #94a3b8;
  margin-left: 4px;
}
</style>
