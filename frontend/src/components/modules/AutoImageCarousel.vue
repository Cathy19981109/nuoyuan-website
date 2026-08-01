<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { toPublicMediaUrl } from '@/utils/media'

const props = defineProps({
  images: { type: Array, default: () => [] },
  intervalMs: { type: Number, default: 3000 },
  altPrefix: { type: String, default: '轮播图' },
})

const FALLBACK_IMAGE =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='675'><rect width='100%' height='100%' fill='%23f1f5f9'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%2394a3b8' font-size='32'>image unavailable</text></svg>"

const index = ref(0)
let timer = null

const list = computed(() =>
  (props.images || [])
    .map((img, i) => {
      const url = typeof img === 'string' ? img : img?.url
      if (!url) return null
      return {
        url,
        name: (typeof img === 'object' && img?.name) || `${props.altPrefix}${i + 1}`,
      }
    })
    .filter(Boolean)
)

const current = computed(() => list.value[index.value] || null)
const showControls = computed(() => list.value.length > 1)

function toPublicUrl(url) {
  return toPublicMediaUrl(url)
}

function onImgError(event) {
  if (event?.target) event.target.src = FALLBACK_IMAGE
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
  <div v-if="current" class="auto-carousel" @mouseenter="stop" @mouseleave="start">
    <div class="auto-carousel-stage">
      <transition name="fade" mode="out-in">
        <img
          :key="`${index}-${current.url}`"
          class="auto-carousel-img"
          :src="toPublicUrl(current.url)"
          :alt="current.name"
          @error="onImgError"
        />
      </transition>

      <template v-if="showControls">
        <button type="button" class="nav-btn nav-prev" aria-label="上一张" @click.stop="prev">‹</button>
        <button type="button" class="nav-btn nav-next" aria-label="下一张" @click.stop="next">›</button>
      </template>
    </div>
    <div v-if="showControls" class="auto-carousel-dots" role="tablist">
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
.auto-carousel {
  position: relative;
  width: 100%;
  min-width: 0;
}

.auto-carousel-stage {
  position: relative;
  width: 100%;
  overflow: hidden;
  border-radius: 12px;
  aspect-ratio: 16 / 9;
  background: #f1f5f9;
}

.auto-carousel-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 12px;
}

.nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.88);
  color: #0b2d5c;
  font-size: 28px;
  line-height: 1;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 10px rgba(15, 23, 42, 0.18);
  transition: background 0.2s, transform 0.2s;
  padding: 0;
}

.nav-btn:hover {
  background: #fff;
}

.nav-btn:active {
  transform: translateY(-50%) scale(0.96);
}

.nav-prev { left: 12px; }
.nav-next { right: 12px; }

.auto-carousel-dots {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 10px;
}

.dot {
  width: 8px;
  height: 8px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: #cbd5e1;
  cursor: pointer;
}

.dot.active {
  background: #0b2d5c;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.45s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 640px) {
  .nav-btn {
    width: 34px;
    height: 34px;
    font-size: 24px;
  }
  .nav-prev { left: 8px; }
  .nav-next { right: 8px; }
}
</style>
