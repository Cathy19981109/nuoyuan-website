<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  product: { type: Object, required: true },
})

const emit = defineEmits(['open-inquiry'])

const activeVariants = computed(() => {
  const rows = Array.isArray(props.product?.variants) ? props.product.variants : []
  const enabled = rows.filter((v) => Number(v.status) !== 0 && String(v.name || '').trim())
  if (enabled.length) return enabled
  const legacy = Array.isArray(props.product?.spec_options) ? props.product.spec_options : []
  return legacy.map((name, idx) => ({
    id: `legacy_${idx}`,
    name,
    goods_code: props.product?.goods_code || '',
    price: '',
    image_url: '',
    status: 1,
  }))
})

const selectedVariantId = ref('')

watch(
  activeVariants,
  (rows) => {
    if (!rows.length) {
      selectedVariantId.value = ''
      return
    }
    const stillValid = rows.some((v) => String(v.id) === String(selectedVariantId.value))
    if (!stillValid) selectedVariantId.value = String(rows[0].id)
  },
  { immediate: true, deep: true }
)

const selectedVariant = computed(() => {
  return activeVariants.value.find((v) => String(v.id) === String(selectedVariantId.value)) || null
})

const displayCover = computed(() => {
  return selectedVariant.value?.image_url || props.product.cover_image || ''
})

function onInquiry() {
  const variant = selectedVariant.value
  emit('open-inquiry', {
    ...props.product,
    selected_variant: variant || null,
    variant_name: variant?.name || '',
    variant_goods_code: variant?.goods_code || '',
    variant_price: variant?.price || '',
    inquiry_product_name: variant?.name
      ? `${props.product.name}（${variant.name}）`
      : props.product.name,
  })
}
</script>

<template>
  <article class="product-card card">
    <router-link :to="product._detailPath || `/products/${product.id}`" class="card-link">
      <div class="card-image">
        <img v-if="displayCover" :src="displayCover" :alt="product.name" />
        <div v-else class="image-placeholder">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="m21 15-5-5L5 21" />
          </svg>
        </div>
        <span v-if="product.is_hot" class="hot-tag">热门</span>
      </div>
      <div class="card-body">
        <h3>{{ product.name }}</h3>
        <p class="code">目录号：{{ selectedVariant?.goods_code || product.goods_code || product.product_code || '-' }}</p>
        <p>{{ product.short_desc }}</p>
      </div>
    </router-link>
    <div class="card-actions">
      <select
        v-if="activeVariants.length"
        v-model="selectedVariantId"
        class="spec-select"
        @click.stop
      >
        <option
          v-for="item in activeVariants"
          :key="item.id"
          :value="String(item.id)"
        >
          {{ item.name }}{{ item.price ? ` · ¥${item.price}` : '' }}
        </option>
      </select>
      <router-link :to="product._detailPath || `/products/${product.id}`" class="link-detail">了解详情</router-link>
      <button class="link-inquiry" @click.stop="onInquiry">立即询价</button>
    </div>
  </article>
</template>

<style scoped>
.card-link {
  display: block;
}

.card-image {
  height: 180px;
  background: var(--color-bg);
  position: relative;
  overflow: hidden;
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-placeholder {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-light);
  opacity: 0.4;
}

.hot-tag {
  position: absolute;
  top: 12px;
  left: 12px;
  background: var(--color-accent);
  color: white;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
}

.card-body {
  padding: 20px;
}

.card-body h3 {
  font-size: 16px;
  margin-bottom: 8px;
  color: var(--color-primary);
}

.card-body p {
  font-size: 13px;
  color: var(--color-text-light);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.code {
  font-size: 12px !important;
  margin-bottom: 6px;
  color: #2563eb !important;
  display: block !important;
}

.card-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: auto auto;
  border-top: 1px solid var(--color-border);
}
.spec-select {
  grid-column: 1 / -1;
  border: none;
  border-bottom: 1px solid var(--color-border);
  padding: 10px;
  font-size: 12px;
  color: #0f172a;
  background: #fff;
}

.link-detail,
.link-inquiry {
  flex: 1;
  text-align: center;
  padding: 12px;
  font-size: 13px;
  transition: background 0.2s;
}

.link-detail {
  color: var(--color-primary);
  border-right: 1px solid var(--color-border);
}

.link-detail:hover {
  background: var(--color-bg);
}

.link-inquiry {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-accent);
  font-weight: 500;
}

.link-inquiry:hover {
  background: #f0fdf4;
}
</style>
