<template>
  <div>
    <div class="page-header">
      <div>
        <h2>询价表单配置</h2>
        <p class="desc">拖拽式组件（简化版）配置客户填写项，支持必填、提示语、长度限制</p>
      </div>
      <div class="toolbar">
        <button class="btn btn-secondary" @click="openPreview">前台预览</button>
        <button class="btn btn-primary" :disabled="saving" @click="saveSchema">{{ saving ? '保存中...' : '保存表单模板' }}</button>
      </div>
    </div>

    <div class="card">
      <div class="toolbar">
        <button class="btn btn-secondary" @click="addField('text')">+ 单行文本</button>
        <button class="btn btn-secondary" @click="addField('textarea')">+ 多行描述</button>
        <button class="btn btn-secondary" @click="addField('select')">+ 下拉选项</button>
        <button class="btn btn-secondary" @click="addField('phone')">+ 联系电话</button>
        <button class="btn btn-secondary" @click="addField('email')">+ 邮箱</button>
      </div>
      <div v-if="loading" class="empty-state">加载中...</div>
      <div v-else-if="!fields.length" class="empty-state">暂无组件，请先新增字段</div>
      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr><th>顺序</th><th>字段名称</th><th>类型</th><th>是否必填</th><th>提示语</th><th>长度限制</th><th>操作</th></tr>
          </thead>
          <tbody>
            <tr
              v-for="(f, i) in fields"
              :key="f.id"
              draggable="true"
              @dragstart="onDragStart(f.id)"
              @dragover.prevent
              @drop="onDrop(f.id)"
            >
              <td>{{ i + 1 }}</td>
              <td><span class="required">*</span><input v-model="f.label" class="form-control" /></td>
              <td>{{ typeText[f.type] || f.type }}</td>
              <td>
                <select v-model="f.required" class="form-control">
                  <option :value="true">必填</option>
                  <option :value="false">选填</option>
                </select>
              </td>
              <td><input v-model="f.placeholder" class="form-control" /></td>
              <td><input v-model.number="f.maxLength" type="number" class="form-control" /></td>
              <td class="actions">
                <span class="drag-handle">⇅ 拖拽</span>
                <button class="btn btn-danger btn-sm" @click="removeField(i)">删除</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getInquiryFormTemplate, saveInquiryFormTemplate } from '@/api'

const loading = ref(false)
const saving = ref(false)
const fields = ref([])
const dragId = ref(null)
const typeText = {
  text: '单行文本',
  textarea: '多行描述',
  select: '下拉选项',
  phone: '联系电话',
  email: '邮箱',
}

function addField(type) {
  fields.value.push({
    id: `f_${Date.now()}_${Math.floor(Math.random() * 9999)}`,
    label: '新字段',
    type,
    required: false,
    placeholder: '请输入内容',
    maxLength: 100,
    options: type === 'select' ? ['选项1', '选项2'] : undefined,
  })
}

function removeField(i) {
  fields.value.splice(i, 1)
}
function onDragStart(id) {
  dragId.value = id
}
function onDrop(targetId) {
  if (!dragId.value || dragId.value === targetId) return
  const arr = fields.value.slice()
  const from = arr.findIndex((i) => i.id === dragId.value)
  const to = arr.findIndex((i) => i.id === targetId)
  if (from < 0 || to < 0) return
  const [moving] = arr.splice(from, 1)
  arr.splice(to, 0, moving)
  fields.value = arr
  dragId.value = null
}

async function loadData() {
  loading.value = true
  try {
    const data = await getInquiryFormTemplate()
    fields.value = data?.schema_json || []
  } catch (e) {
    alert(e.message)
  } finally {
    loading.value = false
  }
}

async function saveSchema() {
  saving.value = true
  try {
    await saveInquiryFormTemplate({ name: '默认询价表单', schema: fields.value })
    alert('表单模板已保存')
  } catch (e) {
    alert(e.message)
  } finally {
    saving.value = false
  }
}

function openPreview() {
  window.open('http://localhost:5173/contact', '_blank')
}

onMounted(loadData)
</script>

<style scoped>
.required { color: #dc2626; margin-right: 4px; font-weight: 700; }
.drag-handle { color: #2563eb; font-size: 12px; cursor: grab; margin-right: 8px; }
</style>
