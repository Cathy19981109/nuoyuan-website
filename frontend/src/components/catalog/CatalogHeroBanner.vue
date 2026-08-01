<template>
  <section
    class="catalog-hero"
    :class="{ 'has-image': !!backgroundImage }"
    :style="heroStyle"
  >
    <div class="hero-overlay" />
    <div class="container">
      <div class="hero-copy">
        <h1>{{ title }}</h1>
        <p v-if="subtitle">{{ subtitle }}</p>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { toPublicMediaUrl } from '@/utils/media'

const props = defineProps({
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  backgroundImage: { type: String, default: '' },
})

function toPublicUrl(url) {
  return toPublicMediaUrl(url)
}

const heroStyle = computed(() => {
  const url = toPublicUrl(props.backgroundImage)
  if (!url) return {}
  return {
    backgroundImage: `url(${url})`,
  }
})
</script>

<style scoped>
.catalog-hero {
  position: relative;
  min-height: 280px;
  display: flex;
  align-items: center;
  color: #fff;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  background-size: cover;
  background-position: center right;
  background-repeat: no-repeat;
  overflow: hidden;
  padding: 56px 0 52px;
}

.catalog-hero.has-image {
  min-height: clamp(260px, 36vw, 420px);
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgba(8, 28, 58, 0.82) 0%, rgba(8, 28, 58, 0.55) 42%, rgba(8, 28, 58, 0.18) 72%, rgba(8, 28, 58, 0.05) 100%),
    linear-gradient(180deg, rgba(8, 28, 58, 0.18) 0%, rgba(8, 28, 58, 0.35) 100%);
  pointer-events: none;
}

.catalog-hero .container {
  position: relative;
  z-index: 1;
}

.hero-copy {
  max-width: 560px;
  text-align: left;
}

.hero-copy h1 {
  margin: 0 0 12px;
  font-size: clamp(28px, 4vw, 42px);
  font-weight: 700;
  letter-spacing: 0.02em;
  line-height: 1.25;
}

.hero-copy p {
  margin: 0;
  font-size: clamp(14px, 1.6vw, 17px);
  line-height: 1.75;
  opacity: 0.92;
}

@media (max-width: 768px) {
  .catalog-hero {
    background-position: center center;
    padding: 40px 0 36px;
  }

  .hero-overlay {
    background: linear-gradient(180deg, rgba(8, 28, 58, 0.72) 0%, rgba(8, 28, 58, 0.55) 100%);
  }
}
</style>
