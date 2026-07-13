<template>
  <span class="hint-wrap" @mouseenter="show = true" @mouseleave="show = false">
    <span class="hint-icon">!</span>
    <div v-if="show" class="hint-pop" role="tooltip">
      <div v-for="(line, idx) in lines" :key="idx">{{ line }}</div>
    </div>
  </span>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  text: { type: String, default: '' },
})

const show = ref(false)
const lines = computed(() => String(props.text || '').split('\n').filter(Boolean))
</script>

<style scoped>
.hint-wrap { position: relative; display: inline-flex; align-items: center; margin-left: 6px; overflow: visible; z-index: 40; }
.hint-icon {
  width: 16px; height: 16px; border-radius: 50%;
  background: #ef4444; color: #fff; font-size: 11px; line-height: 16px; text-align: center; font-weight: 700; cursor: help;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.24);
}
.hint-pop {
  position: absolute; top: 22px; left: 0; width: 320px; z-index: 9999;
  background: #fff; color: #334155; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 10px; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
  font-size: 12px; line-height: 1.55;
  white-space: normal;
  word-break: break-word;
  pointer-events: none;
}
</style>
