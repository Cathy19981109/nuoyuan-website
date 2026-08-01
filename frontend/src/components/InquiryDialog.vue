<script setup>
import { ref, watch, computed, nextTick, onBeforeUnmount } from 'vue'
import { submitInquiry, getInquiryForm, getProducts, getServices } from '@/api'
import { CHINA_REGIONS, citiesOfProvince, isMunicipality } from '@/data/chinaRegions'

const props = defineProps({
  modelValue: Boolean,
  product: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue'])

const HIDDEN_CUSTOM_LABELS = new Set([
  '联系人',
  '联系电话',
  '联系邮箱',
  '单位名称',
  '咨询产品',
  '咨询产品/服务',
  '样品规格',
  '规格/类型',
  '实验需求',
  '需求描述',
  '省份',
  '城市',
  '所在省份',
  '所在城市',
  '所在地区',
])

const form = ref({
  name: '',
  phone: '',
  email: '',
  company: '',
  province: '',
  city: '',
  product_key: '',
  product_name: '',
  product_id: null,
  spec: '',
  demand: '',
})

const loading = ref(false)
const formLoading = ref(false)
const success = ref(false)
const errorMsg = ref('')
const customSchema = ref([])
const catalogItems = ref([])
const OTHER_KEY = 'other'
const catalogMenuOpen = ref(false)
const catalogTriggerRef = ref(null)
const catalogMenuStyle = ref({})

const productItems = computed(() => catalogItems.value.filter((i) => i.kind === 'product'))
const serviceItems = computed(() => catalogItems.value.filter((i) => i.kind === 'service'))

const selectedCatalogItem = computed(() =>
  catalogItems.value.find((item) => item.key === form.value.product_key) || null
)

const isOtherSelected = computed(() => form.value.product_key === OTHER_KEY)

const showSpecField = computed(() => !isOtherSelected.value && !!form.value.product_key)

const catalogDisplayLabel = computed(() => {
  if (form.value.product_key === OTHER_KEY) return '其他综合咨询'
  if (selectedCatalogItem.value) return selectedCatalogItem.value.label
  if (form.value.product_name) return form.value.product_name
  return '请选择产品或服务'
})

function updateCatalogMenuPosition() {
  const el = catalogTriggerRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  const viewportH = window.innerHeight || 0
  const spaceBelow = Math.max(viewportH - rect.bottom - 16, 120)
  const spaceAbove = Math.max(rect.top - 16, 120)
  // Use almost all remaining viewport so every option can show
  const openUp = spaceBelow < 280 && spaceAbove > spaceBelow
  const maxPanel = Math.floor(openUp ? spaceAbove : spaceBelow)
  catalogMenuStyle.value = {
    position: 'fixed',
    left: `${Math.round(rect.left)}px`,
    width: `${Math.round(rect.width)}px`,
    zIndex: 3000,
    maxHeight: `${maxPanel}px`,
    ...(openUp
      ? { bottom: `${Math.round(viewportH - rect.top + 6)}px`, top: 'auto' }
      : { top: `${Math.round(rect.bottom + 6)}px`, bottom: 'auto' }),
  }
}

function onWindowReposition() {
  if (!catalogMenuOpen.value) return
  updateCatalogMenuPosition()
}

const visibleCustomFields = computed(() =>
  (customSchema.value || []).filter((f) => !HIDDEN_CUSTOM_LABELS.has(String(f.label || '').trim()))
)

const cityOptions = computed(() => citiesOfProvince(form.value.province))

const isMunicipalitySelected = computed(() => isMunicipality(form.value.province))

const specOptions = computed(() => {
  if (!showSpecField.value) return []
  const item = selectedCatalogItem.value
  if (!item) return []
  return item.variants || []
})

function onProvinceChange() {
  const cities = citiesOfProvince(form.value.province)
  if (isMunicipality(form.value.province) && cities.length) {
    form.value.city = cities[0]
    return
  }
  if (!cities.includes(form.value.city)) {
    form.value.city = ''
  }
}

function parseVariants(row = {}) {
  const fromJson = Array.isArray(row.variants)
    ? row.variants
    : (() => {
      try {
        const parsed = typeof row.variants_json === 'string'
          ? JSON.parse(row.variants_json)
          : row.variants_json
        return Array.isArray(parsed) ? parsed : []
      } catch {
        return []
      }
    })()

  const enabled = fromJson
    .filter((v) => Number(v?.status) !== 0 && String(v?.name || '').trim())
    .map((v) => ({
      value: String(v.name).trim(),
      label: String(v.name).trim(),
      goods_code: v.goods_code || '',
      price: v.price || '',
    }))

  if (enabled.length) return enabled

  const fromText = String(row.spec_text || '')
    .split(/\r?\n|,|，|；|;/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((name) => ({ value: name, label: name, goods_code: '', price: '' }))

  return fromText
}

function buildCatalog(productList = [], serviceList = []) {
  const products = (productList || []).map((item) => ({
    key: `product:${item.id}`,
    id: item.id,
    kind: 'product',
    label: String(item.name || '').trim(),
    variants: parseVariants(item),
  }))
  const services = (serviceList || []).map((item) => ({
    key: `service:${item.id}`,
    id: item.id,
    kind: 'service',
    label: String(item.name || '').trim(),
    variants: parseVariants(item),
  }))
  return [...products, ...services].filter((item) => item.label)
}

async function fetchAllProducts() {
  const all = []
  let page = 1
  let totalPages = 1
  do {
    const data = await getProducts({ page, pageSize: 200 })
    all.push(...(data?.list || []))
    totalPages = Number(data?.pagination?.totalPages || 1)
    page += 1
  } while (page <= totalPages)
  return all
}

async function fetchAllServices() {
  const all = []
  let page = 1
  let totalPages = 1
  do {
    const data = await getServices({ page, pageSize: 200 })
    all.push(...(data?.list || []))
    totalPages = Number(data?.pagination?.totalPages || 1)
    page += 1
  } while (page <= totalPages)
  return all
}

function resetFormBase() {
  form.value = {
    name: '',
    phone: '',
    email: '',
    company: '',
    province: '',
    city: '',
    product_key: '',
    product_name: '',
    product_id: null,
    spec: '',
    demand: '',
  }
}

function applyIncomingProduct() {
  const incoming = props.product
  if (!incoming) return

  const kind = incoming._detailPath?.includes('/services/') || incoming.service_code
    ? 'service'
    : 'product'
  const key = `${kind}:${incoming.id}`
  const found = catalogItems.value.find((item) => item.key === key)
    || catalogItems.value.find((item) => item.label === (incoming.name || '').trim())

  if (found) {
    form.value.product_key = found.key
    form.value.product_name = found.label
    form.value.product_id = found.id
  } else if (incoming.name) {
    // 兜底：当前列表未命中时仍保留名称
    form.value.product_key = ''
    form.value.product_name = incoming.inquiry_product_name || incoming.name
    form.value.product_id = incoming.id || null
  }

  const variantName = String(incoming.variant_name || incoming.selected_variant?.name || '').trim()
  if (variantName) {
    form.value.spec = variantName
  } else if (found?.variants?.length === 1) {
    form.value.spec = found.variants[0].value
  } else {
    form.value.spec = ''
  }
}

function onProductChange() {
  if (form.value.product_key === OTHER_KEY) {
    form.value.product_name = '其他综合咨询'
    form.value.product_id = null
    form.value.spec = ''
    return
  }
  const item = selectedCatalogItem.value
  if (!item) {
    form.value.product_name = ''
    form.value.product_id = null
    form.value.spec = ''
    return
  }
  form.value.product_name = item.label
  form.value.product_id = item.id
  if (item.variants.length === 1) {
    form.value.spec = item.variants[0].value
  } else if (!item.variants.some((v) => v.value === form.value.spec)) {
    form.value.spec = ''
  }
}

function selectCatalogKey(key) {
  form.value.product_key = key
  onProductChange()
  catalogMenuOpen.value = false
}

async function toggleCatalogMenu() {
  if (formLoading.value) return
  catalogMenuOpen.value = !catalogMenuOpen.value
  if (catalogMenuOpen.value) {
    await nextTick()
    updateCatalogMenuPosition()
  }
}

watch(catalogMenuOpen, (open) => {
  if (open) {
    window.addEventListener('resize', onWindowReposition)
    window.addEventListener('scroll', onWindowReposition, true)
  } else {
    window.removeEventListener('resize', onWindowReposition)
    window.removeEventListener('scroll', onWindowReposition, true)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', onWindowReposition)
  window.removeEventListener('scroll', onWindowReposition, true)
})

watch(
  () => props.modelValue,
  async (val) => {
    if (!val) return
    success.value = false
    errorMsg.value = ''
    catalogMenuOpen.value = false
    resetFormBase()
    formLoading.value = true
    try {
      const tpl = await getInquiryForm()
      customSchema.value = Array.isArray(tpl?.schema_json) ? tpl.schema_json : []
      const [productList, serviceList] = await Promise.all([
        fetchAllProducts(),
        fetchAllServices(),
      ])
      catalogItems.value = buildCatalog(productList, serviceList)
      applyIncomingProduct()
    } catch {
      customSchema.value = []
      catalogItems.value = []
      applyIncomingProduct()
    } finally {
      formLoading.value = false
    }
  }
)

watch(
  () => props.product,
  () => {
    if (props.modelValue) applyIncomingProduct()
  }
)

function close() {
  catalogMenuOpen.value = false
  emit('update:modelValue', false)
}

async function handleSubmit() {
  errorMsg.value = ''
  if (!form.value.name.trim()) {
    errorMsg.value = '请填写联系人姓名'
    return
  }
  if (!form.value.phone.trim()) {
    errorMsg.value = '请填写联系电话'
    return
  }
  if (!form.value.email.trim()) {
    errorMsg.value = '请填写邮箱'
    return
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email.trim())) {
    errorMsg.value = '请填写正确的邮箱格式'
    return
  }
  if (!form.value.province.trim()) {
    errorMsg.value = '请选择省份'
    return
  }
  if (!form.value.city.trim()) {
    errorMsg.value = '请选择城市'
    return
  }
  if (!form.value.product_name.trim()) {
    errorMsg.value = '请选择咨询产品/服务'
    return
  }
  if (showSpecField.value && specOptions.value.length && !form.value.spec.trim()) {
    errorMsg.value = '请选择规格/类型'
    return
  }
  if (!form.value.demand.trim()) {
    errorMsg.value = '请填写需求描述'
    return
  }

  for (const field of visibleCustomFields.value) {
    if (field.required && !String(form.value[field.id] || '').trim()) {
      errorMsg.value = `请填写${field.label}`
      return
    }
  }

  loading.value = true
  try {
    const custom_form_data = [
      ...visibleCustomFields.value.map((f) => ({
        label: f.label,
        value: form.value[f.id] || '',
      })),
      { label: '省份', value: form.value.province || '' },
      { label: '城市', value: form.value.city || '' },
      ...(showSpecField.value && form.value.spec
        ? [{ label: '规格/类型', value: form.value.spec }]
        : []),
    ].filter((row) => String(row.value || '').trim())

    await submitInquiry({
      name: form.value.name,
      phone: form.value.phone,
      email: form.value.email,
      company: form.value.company,
      product_name: form.value.product_name,
      product_id: isOtherSelected.value ? null : (form.value.product_id || props.product?.id || null),
      demand: form.value.demand,
      custom_form_data,
    })
    success.value = true
    resetFormBase()
  } catch (err) {
    errorMsg.value = err.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue" class="overlay" @click.self="close">
      <div class="dialog">
        <div class="dialog-header">
          <button type="button" class="close-btn" @click="close">×</button>
          <h2>立即询价</h2>
          <p class="subtitle">填写您的需求，我们将尽快与您联系</p>
        </div>

        <div class="dialog-body">
          <div v-if="success" class="success-msg">
            <p>提交成功！我们会尽快与您联系。</p>
            <button class="btn btn-primary" @click="close">关闭</button>
          </div>

          <form v-else @submit.prevent="handleSubmit">
            <div v-if="formLoading" class="subtitle">正在加载询价表单...</div>

            <div class="form-row">
              <label><span class="required">*</span>联系人姓名</label>
              <input v-model="form.name" type="text" placeholder="请输入姓名" />
            </div>
            <div class="form-row">
              <label><span class="required">*</span>联系电话</label>
              <input v-model="form.phone" type="tel" placeholder="请输入手机号" />
            </div>
            <div class="form-row">
              <label><span class="required">*</span>邮箱</label>
              <input v-model="form.email" type="email" placeholder="请输入邮箱" />
            </div>
            <div class="form-row">
              <label>公司/单位</label>
              <input v-model="form.company" type="text" placeholder="请输入公司或单位名称（选填）" />
            </div>

            <div class="form-row">
              <label><span class="required">*</span>省份</label>
              <select v-model="form.province" @change="onProvinceChange">
                <option value="">请选择省份/直辖市</option>
                <option
                  v-for="item in CHINA_REGIONS"
                  :key="item.name"
                  :value="item.name"
                >
                  {{ item.name }}
                </option>
              </select>
            </div>

            <div v-if="form.province && !isMunicipalitySelected" class="form-row">
              <label><span class="required">*</span>城市</label>
              <select v-model="form.city">
                <option value="">请选择城市</option>
                <option
                  v-for="city in cityOptions"
                  :key="city"
                  :value="city"
                >
                  {{ city }}
                </option>
              </select>
            </div>

            <div class="form-row">
              <label><span class="required">*</span>咨询产品/服务</label>
              <div class="catalog-picker" @keydown.esc="catalogMenuOpen = false">
                <button
                  ref="catalogTriggerRef"
                  type="button"
                  class="catalog-trigger"
                  :class="{ open: catalogMenuOpen, placeholder: !form.product_key && !form.product_name }"
                  @click="toggleCatalogMenu"
                >
                  <span>{{ catalogDisplayLabel }}</span>
                  <span class="catalog-caret">▾</span>
                </button>
                <Teleport to="body">
                  <div
                    v-if="catalogMenuOpen"
                    class="catalog-menu"
                    :style="catalogMenuStyle"
                  >
                    <template v-if="productItems.length">
                      <div class="catalog-group-label">产品</div>
                      <button
                        v-for="item in productItems"
                        :key="item.key"
                        type="button"
                        class="catalog-option"
                        :class="{ active: form.product_key === item.key }"
                        @click="selectCatalogKey(item.key)"
                      >
                        {{ item.label }}
                      </button>
                    </template>
                    <template v-if="serviceItems.length">
                      <div class="catalog-group-label">服务</div>
                      <button
                        v-for="item in serviceItems"
                        :key="item.key"
                        type="button"
                        class="catalog-option"
                        :class="{ active: form.product_key === item.key }"
                        @click="selectCatalogKey(item.key)"
                      >
                        {{ item.label }}
                      </button>
                    </template>
                    <button
                      type="button"
                      class="catalog-group-label is-action"
                      :class="{ active: form.product_key === OTHER_KEY }"
                      @click="selectCatalogKey(OTHER_KEY)"
                    >
                      其他综合咨询
                    </button>
                  </div>
                </Teleport>
              </div>
            </div>

            <div v-if="showSpecField" class="form-row">
              <label><span v-if="specOptions.length" class="required">*</span>规格/类型</label>
              <select v-model="form.spec" :disabled="!specOptions.length">
                <option value="">
                  {{
                    specOptions.length ? '请选择规格/类型' : '暂无可选规格/类型'
                  }}
                </option>
                <option
                  v-for="opt in specOptions"
                  :key="opt.value"
                  :value="opt.value"
                >
                  {{ opt.label }}{{ opt.price ? ` · ¥${opt.price}` : '' }}
                </option>
              </select>
            </div>

            <div
              v-for="field in visibleCustomFields"
              :key="field.id"
              class="form-row"
            >
              <label><span v-if="field.required" class="required">*</span>{{ field.label }}</label>
              <select
                v-if="field.type === 'select'"
                v-model="form[field.id]"
              >
                <option value="">{{ field.placeholder || '请选择' }}</option>
                <option
                  v-for="opt in (field.options || [])"
                  :key="opt"
                  :value="opt"
                >
                  {{ opt }}
                </option>
              </select>
              <input
                v-else-if="field.type !== 'textarea'"
                v-model="form[field.id]"
                :maxlength="field.maxLength || undefined"
                :type="field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'"
                :placeholder="field.placeholder || '请输入内容'"
              />
              <textarea
                v-else
                v-model="form[field.id]"
                :maxlength="field.maxLength || undefined"
                rows="3"
                :placeholder="field.placeholder || '请输入内容'"
              />
            </div>

            <div class="form-row">
              <label><span class="required">*</span>需求描述</label>
              <textarea v-model="form.demand" rows="4" placeholder="请描述您的具体需求..." />
            </div>

            <p v-if="errorMsg" class="error">{{ errorMsg }}</p>
            <button type="submit" class="btn btn-primary submit-btn" :disabled="loading || formLoading">
              {{ loading ? '提交中...' : '提交询价' }}
            </button>
          </form>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
}

.dialog {
  background: var(--color-white);
  border-radius: 12px;
  width: min(520px, 100%);
  max-height: 90vh;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
}

.dialog-header {
  flex-shrink: 0;
  padding: 28px 32px 12px;
  position: relative;
  background: var(--color-white);
  border-bottom: 1px solid var(--color-border);
}

.dialog-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 20px 32px 28px;
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
  color: var(--color-text-light);
  line-height: 1;
  z-index: 2;
}

.dialog-header h2 {
  font-size: 22px;
  color: var(--color-primary);
  margin-bottom: 4px;
  padding-right: 28px;
}

.subtitle {
  color: var(--color-text-light);
  font-size: 14px;
  margin-bottom: 0;
}

.form-row {
  margin-bottom: 16px;
}

.form-row label {
  display: block;
  font-size: 14px;
  margin-bottom: 6px;
  font-weight: 500;
}

.required {
  color: #dc2626;
  margin-right: 4px;
  font-weight: 700;
}

.form-row input,
.form-row textarea,
.form-row select {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
  font-family: inherit;
  background: #fff;
  color: #0f172a;
}

.form-row select {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  padding-right: 36px;
  background-color: #fff;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8' fill='none'%3E%3Cpath d='M1.5 1.75L6 6.25L10.5 1.75' stroke='%2394a3b8' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 14px center;
  background-size: 12px 8px;
  cursor: pointer;
}

.form-row select:disabled {
  background-color: #f8fafc;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8' fill='none'%3E%3Cpath d='M1.5 1.75L6 6.25L10.5 1.75' stroke='%23cbd5e1' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  color: #94a3b8;
  cursor: not-allowed;
}

.form-row input:focus,
.form-row textarea:focus,
.form-row select:focus {
  border-color: var(--color-primary);
}

.catalog-picker {
  position: relative;
}

.catalog-trigger {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 14px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: #fff;
  font-size: 14px;
  color: #0f172a;
  text-align: left;
  cursor: pointer;
}

.catalog-trigger.placeholder {
  color: #94a3b8;
}

.catalog-trigger.open {
  border-color: var(--color-primary);
}

.catalog-caret {
  flex-shrink: 0;
  width: 12px;
  height: 8px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8' fill='none'%3E%3Cpath d='M1.5 1.75L6 6.25L10.5 1.75' stroke='%2394a3b8' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: center;
  background-size: 12px 8px;
  color: transparent;
  font-size: 0;
  line-height: 0;
}

.catalog-menu {
  overflow: auto;
  overscroll-behavior: contain;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.12);
  padding: 6px 0;
}

.catalog-group-label {
  display: block;
  width: 100%;
  border: none;
  background: transparent;
  padding: 8px 14px 4px;
  font-size: 13px;
  font-weight: 500;
  color: #94a3b8;
  text-align: left;
  cursor: default;
}

.catalog-group-label.is-action {
  cursor: pointer;
  padding: 8px 14px;
}

.catalog-group-label.is-action:hover,
.catalog-group-label.is-action.active {
  background: #f8fafc;
}

.catalog-option {
  display: block;
  width: 100%;
  border: none;
  background: transparent;
  padding: 8px 14px 8px 22px;
  font-size: 14px;
  color: #0f172a;
  text-align: left;
  cursor: pointer;
}

.catalog-option:hover,
.catalog-option.active {
  background: #f1f5f9;
}

.error {
  color: #dc2626;
  font-size: 13px;
  margin-bottom: 12px;
}

.submit-btn {
  width: 100%;
  padding: 12px;
  font-size: 15px;
}

.success-msg {
  text-align: center;
  padding: 32px 0;
}

.success-msg p {
  color: var(--color-accent);
  font-size: 16px;
  margin-bottom: 24px;
}

@media (max-width: 430px) {
  .overlay {
    align-items: flex-end;
    padding: 0;
  }

  .dialog {
    width: 100%;
    max-height: min(92dvh, 100%);
    border-radius: 16px 16px 0 0;
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }

  .dialog-header {
    padding: 20px 18px 12px;
  }

  .dialog-body {
    padding: 16px 18px 24px;
  }

  .dialog-header h2 {
    font-size: 20px;
  }

  .form-row label {
    font-size: 15px;
  }

  .form-row input,
  .form-row textarea,
  .form-row select,
  .catalog-trigger {
    font-size: 16px;
    min-height: 46px;
  }

  .submit-btn {
    min-height: 48px;
    font-size: 16px;
  }
}
</style>
