<template>
  <div>
    <div class="page-header">
      <div>
        <h2>{{ pageTitle }}</h2>
        <p class="desc">{{ pageDesc }}</p>
      </div>
      <button class="btn btn-primary" @click="openForm()">新增分类</button>
    </div>

    <div class="card">
      <div v-if="loading" class="empty-state">加载中...</div>
      <div v-else-if="!flatList.length" class="empty-state">暂无分类</div>
      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>名称</th>
              <th>英文名称</th>
              <th>描述</th>
              <th>拖拽排序</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in flatList"
              :key="item.id"
              draggable="true"
              @dragstart="onDragStart(item.id)"
              @dragover.prevent
              @drop="onDrop(item.id)"
            >
              <td><span :style="{ paddingLeft: item.depth * 20 + 'px' }">{{ item.name }}</span></td>
              <td>{{ item.en_name || '-' }}</td>
              <td>{{ item.description || '-' }}</td>
              <td><span class="drag-handle">⇅ 拖拽</span></td>
              <td><span :class="['tag', STATUS_MAP[item.status]?.class]">{{ STATUS_MAP[item.status]?.label }}</span></td>
              <td class="actions">
                <button class="btn btn-secondary btn-sm" @click="openForm(item)">编辑</button>
                <button class="btn btn-danger btn-sm" @click="handleDelete(item)">删除</button>
              </td>
            </tr>
          </tbody>
        </table>
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
          <div class="form-row">
            <div class="form-group">
              <label>{{ nameLabel }}</label>
              <input v-model="form.name" class="form-control" />
            </div>
            <div class="form-group">
              <label>英文名称</label>
              <input v-model="form.en_name" class="form-control" />
            </div>
          </div>
          <div class="form-group">
            <label>父级分类</label>
            <select v-model="form.parent_id" class="form-control">
              <option :value="0">一级分类</option>
              <option v-for="c in topCategories" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>描述</label>
            <input v-model="form.description" class="form-control" />
          </div>
          <div class="form-group">
            <label>图标</label>
            <ImageUploadField v-model="form.icon" />
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
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  getProductCategories,
  createProductCategory,
  updateProductCategory,
  deleteProductCategory,
  reorderProductCategories,
  getServiceCategories,
  createServiceCategory,
  updateServiceCategory,
  deleteServiceCategory,
  reorderServiceCategories,
} from '@/api'
import { flattenTree, confirmAction, STATUS_MAP } from '@/utils/helpers'
import ImageUploadField from '@/components/ImageUploadField.vue'

const route = useRoute()
const loading = ref(false)
const saving = ref(false)
const showForm = ref(false)
const formError = ref('')
const editing = ref(null)
const tree = ref([])

const defaultForm = () => ({ parent_id: 0, name: '', en_name: '', description: '', icon: '', status: 1 })
const form = ref(defaultForm())
const dragId = ref(null)

const flatList = computed(() => flattenTree(tree.value))
const topCategories = computed(() => tree.value.filter((c) => !editing.value || c.id !== editing.value.id))
const isServiceMode = computed(() => route.name === 'ServiceCategories')
const pageTitle = computed(() => (isServiceMode.value ? '服务分类' : '产品分类'))
const pageDesc = computed(() => (isServiceMode.value ? '管理技术服务的一级/二级分类' : '管理产品中心的一级/二级分类'))
const nameLabel = computed(() => (isServiceMode.value ? '分类名称 *（服务板块名）' : '分类名称 *'))

async function loadData() {
  loading.value = true
  try { tree.value = isServiceMode.value ? await getServiceCategories() : await getProductCategories() }
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
    if (editing.value) {
      if (isServiceMode.value) await updateServiceCategory(editing.value.id, form.value)
      else await updateProductCategory(editing.value.id, form.value)
    } else if (isServiceMode.value) {
      await createServiceCategory(form.value)
    } else {
      await createProductCategory(form.value)
    }
    showForm.value = false
    await loadData()
  } catch (e) { formError.value = e.message }
  finally { saving.value = false }
}

async function handleDelete(item) {
  if (!confirmAction(`确定删除分类「${item.name}」吗？`)) return
  try {
    if (isServiceMode.value) await deleteServiceCategory(item.id)
    else await deleteProductCategory(item.id)
    await loadData()
  }
  catch (e) { alert(e.message) }
}

function onDragStart(id) {
  dragId.value = id
}

async function onDrop(targetId) {
  if (!dragId.value || dragId.value === targetId) return
  const list = flatList.value.slice()
  const from = list.findIndex((i) => i.id === dragId.value)
  const to = list.findIndex((i) => i.id === targetId)
  if (from < 0 || to < 0) return
  const [moving] = list.splice(from, 1)
  list.splice(to, 0, moving)
  try {
    if (isServiceMode.value) await reorderServiceCategories({ orderIds: list.map((item) => item.id) })
    else await reorderProductCategories({ orderIds: list.map((item) => item.id) })
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
