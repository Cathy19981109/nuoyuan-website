<template>
  <div>
    <div class="page-header">
      <div>
        <h2>新闻分类</h2>
        <p class="desc">分类与导航编辑中的「新闻动态」保持联动</p>
      </div>
      <button class="btn btn-primary" :disabled="isNavSource" @click="openForm()">新增分类</button>
    </div>

    <div class="card">
      <div v-if="loading" class="empty-state">加载中...</div>
      <div v-else-if="!list.length" class="empty-state">暂无分类</div>
      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr><th>ID</th><th>名称</th><th>拖拽排序</th><th>状态</th><th>操作</th></tr>
          </thead>
          <tbody>
            <tr
              v-for="item in list"
              :key="item.id"
              draggable="true"
              @dragstart="onDragStart(item.id)"
              @dragover.prevent
              @drop="onDrop(item.id)"
            >
              <td>{{ item.id }}</td>
              <td>{{ item.name }}</td>
              <td><span class="drag-handle">⇅ 拖拽</span></td>
              <td><span :class="['tag', STATUS_MAP[item.status]?.class]">{{ STATUS_MAP[item.status]?.label }}</span></td>
              <td class="actions">
                <button class="btn btn-secondary btn-sm" :disabled="isNavSource" @click="openForm(item)">编辑</button>
                <button class="btn btn-danger btn-sm" :disabled="isNavSource" @click="handleDelete(item)">删除</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="isNavSource" class="empty-state" style="padding-top: 0; color: #475569;">
        当前新闻分类由「导航编辑 -> 新闻动态」管理，如需新增/修改请前往导航编辑页面操作。
      </div>
    </div>

    <div v-if="showForm" class="modal-overlay" @click.self="showForm = false">
      <div class="modal">
        <div class="modal-header">
          <h3>{{ editing ? '编辑分类' : '新增分类' }}</h3>
          <button class="modal-close" @click="showForm = false">&times;</button>
        </div>
        <div class="modal-body">
          <div v-if="formError" class="alert alert-error">{{ formError }}</div>
          <div class="form-group">
            <label>分类名称 *</label>
            <input v-model="form.name" class="form-control" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>状态</label>
              <select v-model="form.status" class="form-control">
                <option :value="1">显示</option>
                <option :value="0">隐藏</option>
              </select>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showForm = false">取消</button>
          <button class="btn btn-primary" :disabled="saving" @click="handleSave">{{ saving ? '保存中...' : '保存' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getNewsCategories, createNewsCategory, updateNewsCategory, deleteNewsCategory, reorderNewsCategories } from '@/api'
import { confirmAction, STATUS_MAP } from '@/utils/helpers'

const loading = ref(false)
const saving = ref(false)
const showForm = ref(false)
const formError = ref('')
const editing = ref(null)
const list = ref([])
const defaultForm = () => ({ name: '', status: 1 })
const form = ref(defaultForm())
const dragId = ref(null)
const isNavSource = ref(false)

async function loadData() {
  loading.value = true
  try {
    const rows = await getNewsCategories()
    list.value = rows
    isNavSource.value = rows.some((row) => row.source === 'nav')
  }
  catch (e) { alert(e.message) }
  finally { loading.value = false }
}

function openForm(item = null) {
  editing.value = item
  form.value = item ? { ...item, sort: undefined } : defaultForm()
  formError.value = ''
  showForm.value = true
}

async function handleSave() {
  if (!form.value.name) { formError.value = '请填写分类名称'; return }
  saving.value = true
  try {
    if (editing.value) await updateNewsCategory(editing.value.id, form.value)
    else await createNewsCategory(form.value)
    showForm.value = false
    await loadData()
  } catch (e) { formError.value = e.message }
  finally { saving.value = false }
}

async function handleDelete(item) {
  if (!confirmAction(`确定删除分类「${item.name}」吗？`)) return
  try { await deleteNewsCategory(item.id); await loadData() }
  catch (e) { alert(e.message) }
}

function onDragStart(id) {
  dragId.value = id
}

async function onDrop(targetId) {
  if (!dragId.value || dragId.value === targetId) return
  const rows = list.value.slice()
  const from = rows.findIndex((i) => i.id === dragId.value)
  const to = rows.findIndex((i) => i.id === targetId)
  if (from < 0 || to < 0) return
  const [moving] = rows.splice(from, 1)
  rows.splice(to, 0, moving)
  try {
    await reorderNewsCategories({ orderIds: rows.map((item) => item.id) })
    await loadData()
  } catch (e) {
    alert(e.message)
  }
  dragId.value = null
}

onMounted(loadData)
</script>

<style scoped>
.drag-handle { color: #2563eb; font-size: 12px; cursor: grab; }
</style>
