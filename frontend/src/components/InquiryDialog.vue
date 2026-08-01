<script setup>
import { ref, watch, computed } from 'vue'
import { submitInquiry, getInquiryForm, getProducts, getServices } from '@/api'

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
])

const form = ref({
  name: '',
  phone: '',
  email: '',
  company: '',
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

const productItems = computed(() => catalogItems.value.filter((i) => i.kind === 'product'))
const serviceItems = computed(() => catalogItems.value.filter((i) => i.kind === 'service'))

const catalogDisplayLabel = computed(() => {
  if (form.value.product_key === OTHER_KEY) return '其他'
  if (selectedCatalogItem.value) return selectedCatalogItem.value.label
  if (form.value.product_name) return form.value.product_name
  return '请选择产品或服务'
})

const visibleCustomFields = computed(() =>
  (customSchema.value || []).filter((f) => !HIDDEN_CUSTOM_LABELS.has(String(f.label || '').trim()))
)

const selectedCatalogItem = computed(() =>
  catalogItems.value.find((item) => item.key === form.value.product_key) || null
)

const isOtherSelected = computed(() => form.value.product_key === OTHER_KEY)

const showSpecField = computed(() => !isOtherSelected.value && !!form.value.product_key)

const specOptions = computed(() => {
  if (!showSpecField.value) return []
  const item = selectedCatalogItem.value
  if (!item) return []
  return item.variants || []
})

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
    form.value.product_name = '其他'
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

function toggleCatalogMenu() {
  if (formLoading.value) return
  catalogMenuOpen.value = !catalogMenuOpen.value
}

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
        <button class="close-btn" @click="close">×</button>
        <h2>立即询价</h2>
        <p class="subtitle">填写您的需求，我们将尽快与您联系</p>

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
            <label><span class="required">*</span>咨询产品/服务</label>
            <div class="catalog-picker" @keydown.esc="catalogMenuOpen = false">
              <button
                type="button"
                class="catalog-trigger"
                :class="{ open: catalogMenuOpen, placeholder: !form.product_key && !form.product_name }"
                @click="toggleCatalogMenu"
              >
                <span>{{ catalogDisplayLabel }}</span>
                <span class="catalog-caret">▾</span>
              </button>
              <div v-if="catalogMenuOpen" class="catalog-menu">
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
                  其他
                </button>
              </div>
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
  padding: 32px;
  width: min(520px, 100%);
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
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
}

.dialog h2 {
  font-size: 22px;
  color: var(--color-primary);
  margin-bottom: 4px;
}

.subtitle {
  color: var(--color-text-light);
  font-size: 14px;
  margin-bottom: 24px;
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
}

.form-row input:focus,
.form-row textarea:focus,
.form-row select:focus {
  border-color: var(--color-primary);
}

.form-row select:disabled {
  background: #f8fafc;
  color: #94a3b8;
  cursor: not-allowed;
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
  color: #94a3b8;
  font-size: 12px;
  line-height: 1;
}

.catalog-menu {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(100% + 6px);
  z-index: 5;
  max-height: 260px;
  overflow: auto;
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
</style>
