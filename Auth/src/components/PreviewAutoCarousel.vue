<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { toPublicMediaUrl } from '@/utils/media'

const props = defineProps({
  images: { type: Array, default: () => [] },
  intervalMs: { type: Number, default: 3000 },
})

const index = ref(0)
let timer = null

const list = computed(() =>
  (props.images || [])
    .map((img, i) => {
      const url = typeof img === 'string' ? img : img?.url
      if (!url) return null
      return { url, name: (typeof img === 'object' && img?.name) || `轮播${i + 1}` }
    })
    .filter(Boolean)
)

const current = computed(() => list.value[index.value] || null)
const showControls = computed(() => list.value.length > 1)

function toPublicUrl(url) {
  return toPublicMediaUrl(url)
}

function stop() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

function start() {
  stop()
  if (list.value.length <= 1) return
  timer = window.setInterval(() => {
    index.value = (index.value + 1) % list.value.length
  }, props.intervalMs)
}

function goTo(i) {
  if (!list.value.length) return
  const len = list.value.length
  index.value = ((i % len) + len) % len
  start()
}

function prev() {
  goTo(index.value - 1)
}

function next() {
  goTo(index.value + 1)
}

watch(list, () => {
  index.value = 0
  start()
})

onMounted(start)
onBeforeUnmount(stop)
</script>

<template>
  <div v-if="current" class="preview-auto-carousel">
    <div class="preview-stage">
      <img class="preview-auto-img" :src="toPublicUrl(current.url)" :alt="current.name" />
      <template v-if="showControls">
        <button type="button" class="nav-btn nav-prev" aria-label="上一张" @click.stop="prev">‹</button>
        <button type="button" class="nav-btn nav-next" aria-label="下一张" @click.stop="next">›</button>
      </template>
    </div>
    <div v-if="showControls" class="preview-auto-dots">
      <button
        v-for="(_, i) in list"
        :key="i"
        type="button"
        class="dot"
        :class="{ active: i === index }"
        :aria-label="`第 ${i + 1} 张`"
        @click="goTo(i)"
      />
    </div>
  </div>
</template>

<style scoped>
.preview-auto-carousel {
  width: 100%;
  height: 100%;
  margin: 0;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.preview-stage {
  position: relative;
  flex: 1;
  min-height: 0;
}
.preview-auto-img {
  width: 100%;
  height: 100%;
  min-height: 96px;
  object-fit: cover;
  border-radius: 0;
  border: none;
  display: block;
}
.nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  color: #0b2d5c;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  box-shadow: 0 1px 6px rgba(15, 23, 42, 0.16);
}
.nav-prev { left: 6px; }
.nav-next { right: 6px; }
.preview-auto-dots {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-top: 6px;
  flex-shrink: 0;
}
.dot {
  width: 6px;
  height: 6px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: #cbd5e1;
  cursor: pointer;
}
.dot.active {
  background: #0b2d5c;
}
</style>
