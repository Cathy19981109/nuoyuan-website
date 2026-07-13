<template>
  <div>
    <div class="page-header">
      <div>
        <h2>筛选标签管理</h2>
        <p class="desc">维护前台产品筛选栏的标签项，支持拖拽排序</p>
      </div>
      <button class="btn btn-primary" @click="openGroupDialog()">新增筛选大类</button>
    </div>

    <div class="tag-layout">
      <div v-for="group in groups" :key="group.key" class="card">
        <div class="group-header">
          <h3>{{ group.title }}</h3>
          <div class="group-actions">
            <button class="btn btn-secondary btn-sm" @click="openGroupDialog(group)">重命名</button>
            <button class="btn btn-danger btn-sm" @click="removeGroup(group)">删除大类</button>
            <button class="btn btn-primary btn-sm" @click="openCreate(group.key)">新增标签</button>
          </div>
        </div>
        <div v-if="!tags[group.key]?.length" class="empty-state">暂无标签</div>
        <div v-else class="tag-list">
          <div
            v-for="item in tags[group.key]"
            :key="item.id"
            class="tag-row"
            draggable="true"
            @dragstart="onDragStart(group.key, item.id)"
            @dragover.prevent
            @drop="onDrop(group.key, item.id)"
          >
            <span class="drag-handle">⇅</span>
            <span class="tag-name">{{ item.name }}</span>
            <div class="actions">
              <button class="btn btn-secondary btn-sm" @click="openEdit(group.key, item)">编辑</button>
              <button class="btn btn-danger btn-sm" @click="remove(group.key, item)">删除</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showDialog" class="modal-overlay" @click.self="showDialog = false">
      <div class="modal">
        <div class="modal-header">
          <h3>{{ editing ? '编辑标签' : '新增标签' }}</h3>
          <button class="modal-close" @click="showDialog = false">&times;</button>
        </div>
        <div class="modal-body">
          <div v-if="errorText" class="alert alert-error">{{ errorText }}</div>
          <div class="form-group">
            <label>标签名称</label>
            <input v-model="form.tag_name" class="form-control" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showDialog = false">取消</button>
          <button class="btn btn-primary" :disabled="saving" @click="save">{{ saving ? '保存中...' : '保存' }}</button>
        </div>
      </div>
    </div>

    <div v-if="showGroupDialog" class="modal-overlay" @click.self="showGroupDialog = false">
      <div class="modal">
        <div class="modal-header">
          <h3>{{ editingGroup ? '编辑筛选大类' : '新增筛选大类' }}</h3>
          <button class="modal-close" @click="showGroupDialog = false">&times;</button>
        </div>
        <div class="modal-body">
          <div v-if="groupErrorText" class="alert alert-error">{{ groupErrorText }}</div>
          <div class="form-group">
            <label>大类名称</label>
            <input v-model="groupForm.group_title" class="form-control" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showGroupDialog = false">取消</button>
          <button class="btn btn-primary" :disabled="savingGroup" @click="saveGroup">{{ savingGroup ? '保存中...' : '保存' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import {
  getProductFilterTags,
  createProductFilterGroup,
  updateProductFilterGroup,
  deleteProductFilterGroup,
  createProductFilterTag,
  updateProductFilterTag,
  deleteProductFilterTag,
  reorderProductFilterTags,
} from '@/api'
import { confirmAction } from '@/utils/helpers'

const groups = ref([])

const tags = ref({ product_type: [], app_type: [], level_tag: [] })
const dragging = ref({ group: '', id: null })
const showDialog = ref(false)
const editing = ref(null)
const saving = ref(false)
const errorText = ref('')
const form = ref({ tag_group: 'product_type', tag_name: '' })
const showGroupDialog = ref(false)
const editingGroup = ref(null)
const savingGroup = ref(false)
const groupErrorText = ref('')
const groupForm = ref({ group_title: '' })

async function loadData() {
  const data = await getProductFilterTags()
  groups.value = Array.isArray(data.groups) ? data.groups.map((g) => ({ key: g.key, title: g.title, id: g.id })) : []
  tags.value = data
}

function openCreate(group) {
  editing.value = null
  form.value = { tag_group: group, tag_name: '' }
  errorText.value = ''
  showDialog.value = true
}

function openEdit(group, item) {
  editing.value = item
  form.value = { tag_group: group, tag_name: item.name }
  errorText.value = ''
  showDialog.value = true
}

async function save() {
  if (!form.value.tag_name.trim()) {
    errorText.value = '请输入标签名称'
    return
  }
  saving.value = true
  try {
    if (editing.value) {
      await updateProductFilterTag(editing.value.id, { tag_name: form.value.tag_name.trim() })
    } else {
      await createProductFilterTag({ tag_group: form.value.tag_group, tag_name: form.value.tag_name.trim() })
    }
    showDialog.value = false
    await loadData()
  } catch (e) {
    errorText.value = e.message
  } finally {
    saving.value = false
  }
}

async function remove(group, item) {
  if (!confirmAction(`确定删除标签「${item.name}」吗？`)) return
  try {
    await deleteProductFilterTag(item.id)
    await loadData()
  } catch (e) {
    alert(e.message)
  }
}

function openGroupDialog(group = null) {
  editingGroup.value = group
  groupForm.value = { group_title: group?.title || '' }
  groupErrorText.value = ''
  showGroupDialog.value = true
}

async function saveGroup() {
  if (!groupForm.value.group_title.trim()) {
    groupErrorText.value = '请输入大类名称'
    return
  }
  savingGroup.value = true
  try {
    if (editingGroup.value) {
      await updateProductFilterGroup(editingGroup.value.id, { group_title: groupForm.value.group_title.trim() })
    } else {
      await createProductFilterGroup({ group_title: groupForm.value.group_title.trim() })
    }
    showGroupDialog.value = false
    await loadData()
  } catch (e) {
    groupErrorText.value = e.message
  } finally {
    savingGroup.value = false
  }
}

async function removeGroup(group) {
  if (!confirmAction(`确定删除筛选大类「${group.title}」吗？删除后该大类标签会一起删除。`)) return
  try {
    await deleteProductFilterGroup(group.id)
    await loadData()
  } catch (e) {
    alert(e.message)
  }
}

function onDragStart(group, id) {
  dragging.value = { group, id }
}

async function onDrop(group, targetId) {
  if (dragging.value.group !== group || !dragging.value.id || dragging.value.id === targetId) return
  const rows = [...(tags.value[group] || [])]
  const from = rows.findIndex((i) => i.id === dragging.value.id)
  const to = rows.findIndex((i) => i.id === targetId)
  if (from < 0 || to < 0) return
  const [moving] = rows.splice(from, 1)
  rows.splice(to, 0, moving)
  tags.value[group] = rows
  try {
    await reorderProductFilterTags(group, { orderIds: rows.map((i) => i.id) })
  } catch (e) {
    alert(e.message)
    await loadData()
  } finally {
    dragging.value = { group: '', id: null }
  }
}

onMounted(loadData)
</script>

<style scoped>
.tag-layout { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
.group-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.group-actions { display: flex; gap: 6px; }
.tag-list { display: grid; gap: 8px; }
.tag-row { display: flex; align-items: center; gap: 8px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px; }
.drag-handle { color: #2563eb; cursor: grab; }
.tag-name { flex: 1; }
</style>
