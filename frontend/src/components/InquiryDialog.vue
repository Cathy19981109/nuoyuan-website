<script setup>
import { ref, watch, computed } from 'vue'
import { submitInquiry, getInquiryForm, getProducts, getServices } from '@/api'

const props = defineProps({
  modelValue: Boolean,
  product: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue'])

const form = ref({
  name: '',
  phone: '',
  email: '',
  company: '',
  product_name: '',
  demand: '',
})

const loading = ref(false)
const formLoading = ref(false)
const success = ref(false)
const errorMsg = ref('')
const customSchema = ref([])
const inquiryOptions = ref([])
const inquiryKeyword = ref('')
const inquiryPanelOpen = ref(false)
const MAX_OPTION_COUNT = 20

watch(
  () => props.modelValue,
  async (val) => {
    if (val) {
      success.value = false
      errorMsg.value = ''
      form.value.product_name = props.product?.name || ''
      formLoading.value = true
      try {
        const tpl = await getInquiryForm()
        customSchema.value = tpl?.schema_json || []
        const [productList, serviceList] = await Promise.all([
          fetchAllProducts(),
          fetchAllServices(),
        ])
        inquiryOptions.value = buildInquiryOptions(productList, serviceList)
        inquiryKeyword.value = form.value.product_name || ''
      } catch {
        customSchema.value = []
        inquiryOptions.value = []
        inquiryKeyword.value = form.value.product_name || ''
      } finally {
        formLoading.value = false
      }
    }
  }
)

watch(
  () => props.product,
  (val) => {
    if (val) {
      form.value.product_name = val.name
      inquiryKeyword.value = val.name
    }
  }
)

function buildInquiryOptions(productList = [], serviceList = []) {
  const dedupe = []
  const seen = new Set()
  const pushName = (name) => {
    const cleanName = String(name || '').trim()
    if (!cleanName) return
    const key = cleanName.toLowerCase()
    if (!seen.has(key)) {
      seen.add(key)
      dedupe.push({ value: cleanName, label: cleanName })
    }
  }
  ;(productList || []).forEach((item) => pushName(item?.name))
  ;(serviceList || []).forEach((item) => pushName(item?.name))
  return dedupe
}

const filteredInquiryOptions = computed(() => {
  const kw = String(inquiryKeyword.value || '').trim().toLowerCase()
  if (!kw) return inquiryOptions.value.slice(0, MAX_OPTION_COUNT)
  return inquiryOptions.value
    .filter((item) => item.label.toLowerCase().includes(kw))
    .slice(0, MAX_OPTION_COUNT)
})

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

function close() {
  emit('update:modelValue', false)
  inquiryPanelOpen.value = false
}

function onInquiryInput() {
  form.value.product_name = inquiryKeyword.value
  inquiryPanelOpen.value = true
}

function onInquiryFocus() {
  inquiryPanelOpen.value = true
}

function onInquiryBlur() {
  setTimeout(() => {
    inquiryPanelOpen.value = false
  }, 120)
}

function pickInquiryOption(item) {
  form.value.product_name = item.value
  inquiryKeyword.value = item.value
  inquiryPanelOpen.value = false
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
  if (!form.value.product_name.trim()) {
    errorMsg.value = '请选择咨询产品/服务'
    return
  }

  loading.value = true
  try {
    await submitInquiry({
      ...form.value,
      product_id: props.product?.id || null,
      custom_form_data: customSchema.value.map((f) => ({
        label: f.label,
        value: form.value[f.id] || '',
      })),
    })
    success.value = true
    form.value = { name: '', phone: '', email: '', company: '', product_name: '', demand: '' }
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
            <label>联系人姓名 *</label>
            <input v-model="form.name" type="text" placeholder="请输入姓名" />
          </div>
          <div class="form-row">
            <label>联系电话 *</label>
            <input v-model="form.phone" type="tel" placeholder="请输入手机号" />
          </div>
          <div class="form-row">
            <label>邮箱</label>
            <input v-model="form.email" type="email" placeholder="请输入邮箱（选填）" />
          </div>
          <div class="form-row">
            <label>公司/单位</label>
            <input v-model="form.company" type="text" placeholder="请输入公司或单位名称" />
          </div>
          <div class="form-row">
            <label>咨询产品/服务 *</label>
            <div class="inquiry-picker">
              <input
                v-model="inquiryKeyword"
                type="text"
                placeholder="请输入产品名/服务名（支持模糊搜索）"
                @input="onInquiryInput"
                @focus="onInquiryFocus"
                @blur="onInquiryBlur"
              />
              <div v-if="inquiryPanelOpen" class="inquiry-options">
                <button
                  v-for="item in filteredInquiryOptions"
                  :key="item.value"
                  type="button"
                  class="inquiry-option"
                  @mousedown.prevent="pickInquiryOption(item)"
                >
                  {{ item.label }}
                </button>
                <div v-if="!filteredInquiryOptions.length" class="inquiry-empty">没有匹配结果，请继续输入</div>
              </div>
            </div>
          </div>
          <div class="form-row">
            <label>需求描述</label>
            <textarea v-model="form.demand" rows="4" placeholder="请描述您的具体需求..." />
          </div>
          <div v-for="field in customSchema.filter(f => !['联系人','联系电话','联系邮箱','单位名称','咨询产品','实验需求'].includes(f.label))" :key="field.id" class="form-row">
            <label>{{ field.label }}<span v-if="field.required"> *</span></label>
            <input
              v-if="field.type !== 'textarea'"
              v-model="form[field.id]"
              :maxlength="field.maxLength || undefined"
              type="text"
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
          <p v-if="errorMsg" class="error">{{ errorMsg }}</p>
          <button type="submit" class="btn btn-primary submit-btn" :disabled="loading">
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
}

.inquiry-picker {
  position: relative;
}

.inquiry-options {
  margin-top: 6px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  max-height: 180px;
  overflow: auto;
  background: #fff;
  display: grid;
  gap: 4px;
  padding: 6px;
}

.inquiry-option {
  text-align: left;
  border: 1px solid transparent;
  border-radius: 6px;
  background: #fff;
  padding: 8px 10px;
  cursor: pointer;
  font-size: 13px;
  color: #1f2937;
}

.inquiry-option:hover {
  background: #f3f4f6;
  border-color: #e5e7eb;
}

.inquiry-empty {
  color: #6b7280;
  font-size: 12px;
  padding: 8px 10px;
}

.form-row input:focus,
.form-row textarea:focus,
.form-row select:focus {
  border-color: var(--color-primary);
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
