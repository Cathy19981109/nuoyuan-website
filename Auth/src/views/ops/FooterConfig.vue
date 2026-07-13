<template>
  <div>
    <div class="page-header">
      <div>
        <h2>页脚底部配置</h2>
        <p class="desc">支持多栏布局、二维码、链接和版权信息</p>
      </div>
      <div class="toolbar">
        <button class="btn btn-secondary" @click="openPreview">前台预览</button>
        <button class="btn btn-primary" @click="openCreate">新增栏目</button>
      </div>
    </div>

    <div class="card">
      <div v-if="loading" class="empty-state">加载中...</div>
      <div v-else-if="!rows.length" class="empty-state">暂无页脚栏目</div>
      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr><th>栏目标题</th><th>布局栏数</th><th>二维码</th><th>拖拽排序</th><th>状态</th><th>操作</th></tr>
          </thead>
          <tbody>
            <tr
              v-for="row in rows"
              :key="row.id"
              draggable="true"
              @dragstart="onDragStart(row.id)"
              @dragover.prevent
              @drop="onDrop(row.id)"
            >
              <td>{{ row.title }}</td>
              <td>{{ row.layout_type }}栏</td>
              <td>{{ row.qrcode_image ? '已设置' : '未设置' }}</td>
              <td><span class="drag-handle">⇅ 拖拽</span></td>
              <td><span :class="['tag', row.status ? 'tag-success' : 'tag-danger']">{{ row.status ? '显示' : '隐藏' }}</span></td>
              <td class="actions">
                <button class="btn btn-secondary btn-sm" @click="editRow(row)">编辑</button>
                <button class="btn btn-danger btn-sm" @click="removeRow(row)">删除</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="showForm" class="modal-overlay" @click.self="showForm = false">
      <div class="modal modal-lg">
        <div class="modal-header">
          <h3>{{ editing ? '编辑页脚栏目' : '新增页脚栏目' }}</h3>
          <button class="modal-close" @click="showForm = false">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>栏目标题 *</label>
            <input v-model="form.title" class="form-control" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>布局栏数</label>
              <select v-model.number="form.layout_type" class="form-control">
                <option :value="1">1栏</option>
                <option :value="2">2栏</option>
                <option :value="3">3栏</option>
                <option :value="4">4栏</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>二维码图片</label>
            <ImageUploadField v-model="form.qrcode_image" />
            <div class="hint">二维码上传规范：1:1，推荐300x300，透明png，<=50MB</div>
          </div>
          <div class="form-group">
            <label>版权文字（最多100字符）</label>
            <input v-model="form.copyright_text" maxlength="100" class="form-control" />
          </div>
          <div class="form-group">
            <label>栏目链接</label>
            <div v-for="(link, idx) in links" :key="idx" class="link-row">
              <input v-model="link.text" class="form-control" placeholder="链接文字" />
              <input v-model="link.url" class="form-control" placeholder="链接地址" />
              <button type="button" class="btn btn-danger btn-sm" @click="removeLink(idx)">删除</button>
            </div>
            <button type="button" class="btn btn-secondary btn-sm" @click="addLink">+ 添加链接</button>
          </div>
          <div class="form-group">
            <label>状态</label>
            <select v-model.number="form.status" class="form-control">
              <option :value="1">显示</option>
              <option :value="0">隐藏</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showForm = false">取消</button>
          <button class="btn btn-primary" :disabled="saving" @click="saveRow">{{ saving ? '保存中...' : '保存' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getFooterBlocks, createFooterBlock, updateFooterBlock, deleteFooterBlock } from '@/api'
import ImageUploadField from '@/components/ImageUploadField.vue'

const loading = ref(false)
const rows = ref([])
const showForm = ref(false)
const editing = ref(null)
const saving = ref(false)
const links = ref([])
const dragId = ref(null)
const form = ref({
  title: '',
  layout_type: 3,
  qrcode_image: '',
  copyright_text: '',
  sort: 0,
  status: 1,
})

async function loadData() {
  loading.value = true
  try {
    rows.value = await getFooterBlocks()
  } catch (e) {
    alert(e.message)
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editing.value = null
  form.value = { title: '', layout_type: 3, qrcode_image: '', copyright_text: '', sort: 0, status: 1 }
  links.value = []
  showForm.value = true
}

function editRow(row) {
  editing.value = row
  form.value = {
    title: row.title || '',
    layout_type: row.layout_type || 3,
    qrcode_image: row.qrcode_image || '',
    copyright_text: row.copyright_text || '',
    sort: row.sort || 0,
    status: row.status || 1,
  }
  links.value = Array.isArray(row.links_json) ? row.links_json : []
  showForm.value = true
}

async function saveRow() {
  if (!form.value.title) return alert('请填写栏目标题')
  saving.value = true
  try {
    const payload = { ...form.value, links: links.value }
    if (editing.value) await updateFooterBlock(editing.value.id, payload)
    else await createFooterBlock(payload)
    showForm.value = false
    await loadData()
  } catch (e) {
    alert(e.message)
  } finally {
    saving.value = false
  }
}

function addLink() {
  links.value.push({ text: '', url: '' })
}
function removeLink(idx) {
  links.value.splice(idx, 1)
}
function onDragStart(id) {
  dragId.value = id
}
async function onDrop(targetId) {
  if (!dragId.value || dragId.value === targetId) return
  const arr = rows.value.slice()
  const from = arr.findIndex((i) => i.id === dragId.value)
  const to = arr.findIndex((i) => i.id === targetId)
  if (from < 0 || to < 0) return
  const [m] = arr.splice(from, 1)
  arr.splice(to, 0, m)
  try {
    await Promise.all(arr.map((item, idx) => updateFooterBlock(item.id, { sort: idx })))
    await loadData()
  } catch (e) {
    alert(e.message)
  }
  dragId.value = null
}

async function removeRow(row) {
  if (!window.confirm(`确认删除栏目「${row.title}」吗？`)) return
  try {
    await deleteFooterBlock(row.id)
    await loadData()
  } catch (e) {
    alert(e.message)
  }
}

function openPreview() {
  window.open('http://localhost:5173/', '_blank')
}

onMounted(loadData)
</script>

<style scoped>
.drag-handle { color: #2563eb; font-size: 12px; cursor: grab; }
.link-row { display: grid; grid-template-columns: 1fr 1fr auto; gap: 8px; margin-bottom: 8px; }
</style>
