<template>
  <nav v-if="items.length" class="page-breadcrumb" aria-label="路径导航">
    <div class="container">
      <ol class="crumb-list">
        <li v-for="(item, idx) in items" :key="`${item.label}-${idx}`" class="crumb-item">
          <router-link v-if="item.to && idx < items.length - 1" :to="item.to" class="crumb-link">
            {{ item.label }}
          </router-link>
          <span v-else class="crumb-current">{{ item.label }}</span>
          <span v-if="idx < items.length - 1" class="crumb-sep" aria-hidden="true">&gt;</span>
        </li>
      </ol>
    </div>
  </nav>
</template>

<script setup>
defineProps({
  items: { type: Array, default: () => [] },
})
</script>

<style scoped>
.page-breadcrumb {
  background: #fff;
  border-bottom: 1px solid #eef2f7;
  padding: 14px 0;
}

.crumb-list {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 13px;
  line-height: 1.4;
  color: #94a3b8;
}

@media (max-width: 430px) {
  .page-breadcrumb {
    padding: 12px 0;
  }

  .crumb-list {
    font-size: 14px;
    line-height: 1.5;
  }
}

.crumb-item {
  display: inline-flex;
  align-items: center;
}

.crumb-link {
  color: #94a3b8;
  text-decoration: none;
}

.crumb-link:hover {
  color: var(--color-primary, #0b2d5c);
}

.crumb-current {
  color: #64748b;
}

.crumb-sep {
  margin: 0 8px;
  color: #cbd5e1;
}
</style>
