<template>
  <div>
    <div class="page-header">
      <div>
        <h2>筛选标签管理</h2>
        <p class="desc">维护前台产品筛选栏的标签项，支持拖拽排序</p>
      </div>
      <button class="btn btn-primary" @click="openGroupDialog()">新增筛选大类</button>
    </div>

    <div v-if="!groups.length" class="empty-board">
      <p>暂无筛选大类</p>
      <span>点击右上角「新增筛选大类」开始配置</span>
    </div>
    <div v-else class="tag-layout">
      <article v-for="group in groups" :key="group.key" class="group-card">
        <header class="group-head">
          <div class="group-title-row">
            <h3 class="group-title">{{ group.title }}</h3>
            <span class="group-count">{{ tags[group.key]?.length || 0 }} 个标签</span>
          </div>
          <div class="group-actions">
            <button type="button" class="btn btn-secondary btn-sm" @click="openGroupDialog(group)">重命名</button>
            <button type="button" class="btn btn-danger btn-sm" @click="removeGroup(group)">删除大类</button>
            <button type="button" class="btn btn-primary btn-sm" @click="openCreate(group.key)">新增标签</button>
          </div>
        </header>
        <div v-if="!tags[group.key]?.length" class="group-empty">暂无标签，点击上方新增</div>
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
            <span class="drag-handle" title="拖拽排序">⇅</span>
            <span class="tag-name">{{ item.name }}</span>
            <div class="tag-actions">
              <button type="button" class="btn btn-secondary btn-sm" @click="openEdit(group.key, item)">编辑</button>
              <button type="button" class="btn btn-danger btn-sm" @click="remove(group.key, item)">删除</button>
            </div>
          </div>
        </div>
      </article>
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
.empty-board {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 220px;
  padding: 32px;
  background: var(--color-white);
  border: 1px dashed var(--color-border);
  border-radius: 12px;
  color: var(--color-text-light);
}
.empty-board p {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--color-primary);
}

.tag-layout {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  align-items: start;
}

.group-card {
  min-width: 0;
  background: var(--color-white);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  box-shadow: var(--shadow);
  overflow: hidden;
}

.group-head {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 16px 14px;
  background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
  border-bottom: 1px solid var(--color-border);
  border-top: 3px solid var(--color-primary);
}

.group-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-width: 0;
}

.group-title {
  margin: 0;
  min-width: 0;
  flex: 1;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.35;
  color: var(--color-primary);
  overflow-wrap: anywhere;
}

.group-count {
  flex-shrink: 0;
  padding: 2px 8px;
  border-radius: 999px;
  background: #e8eef6;
  color: var(--color-primary-light);
  font-size: 12px;
  font-weight: 600;
  line-height: 1.4;
}

.group-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.group-empty {
  margin: 16px;
  padding: 28px 12px;
  text-align: center;
  color: var(--color-text-light);
  font-size: 13px;
  background: #f8fafc;
  border: 1px dashed var(--color-border);
  border-radius: 8px;
}

.tag-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 16px 16px;
}

.tag-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.tag-row:hover {
  border-color: #c5d4e8;
  box-shadow: 0 1px 2px rgba(11, 45, 92, 0.06);
}

.drag-handle {
  flex-shrink: 0;
  color: var(--color-primary-light);
  cursor: grab;
  font-size: 13px;
  opacity: 0.7;
  user-select: none;
}

.tag-name {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.45;
  color: var(--color-text);
  overflow-wrap: anywhere;
}

.tag-actions {
  display: flex;
  flex-shrink: 0;
  gap: 6px;
}

.tag-actions .btn {
  font-size: 12px;
  padding: 3px 8px;
}

@media (max-width: 720px) {
  .tag-layout {
    grid-template-columns: 1fr;
  }
}
</style>
