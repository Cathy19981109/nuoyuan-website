<template>
  <div>
    <div class="page-header">
      <div>
        <h2>新闻管理</h2>
        <p class="desc">发布和管理公司新闻与行业动态</p>
      </div>
      <button class="btn btn-primary" @click="openForm()">发布新闻</button>
    </div>

    <div class="toolbar">
      <select v-model="filterCategory" class="form-control" style="max-width:160px" @change="loadData(1)">
        <option value="">全部分类</option>
        <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
      </select>
      <input v-model="keyword" class="form-control" style="max-width:200px" placeholder="搜索标题" @keyup.enter="loadData(1)" />
      <button class="btn btn-secondary" @click="loadData(1)">搜索</button>
    </div>

    <div class="card">
      <div v-if="loading" class="empty-state">加载中...</div>
      <div v-else-if="!list.length" class="empty-state">暂无新闻</div>
      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th><th>标题</th><th>分类</th><th>置顶</th><th>状态</th><th>发布时间</th><th>拖拽排序</th><th>操作</th>
            </tr>
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
              <td>{{ item.title }}</td>
              <td>{{ getCategoryName(item.category_id) }}</td>
              <td><span :class="['tag', item.is_top ? 'tag-warning' : 'tag-default']">{{ item.is_top ? '置顶' : '-' }}</span></td>
              <td><span :class="['tag', STATUS_MAP[item.status]?.class]">{{ item.status ? '已发布' : '草稿' }}</span></td>
              <td>{{ formatDate(item.publish_time) }}</td>
              <td><span class="drag-handle">⇅ 拖拽</span></td>
              <td class="actions">
                <button class="btn btn-secondary btn-sm" @click="openForm(item)">编辑</button>
                <button class="btn btn-danger btn-sm" @click="handleDelete(item)">删除</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="pagination" v-if="pagination.total > 0">
        <select v-model.number="pageSize" class="form-control" style="max-width:110px" @change="loadData(1)">
          <option :value="10">10条/页</option>
          <option :value="20">20条/页</option>
          <option :value="50">50条/页</option>
        </select>
        <button class="btn btn-secondary btn-sm" :disabled="page <= 1" @click="loadData(1)">首页</button>
        <button class="btn btn-secondary btn-sm" :disabled="page <= 1" @click="loadData(page - 1)">上一页</button>
        <span>第 {{ page }} / {{ pagination.totalPages }} 页，共 {{ pagination.total }} 条</span>
        <button class="btn btn-secondary btn-sm" :disabled="page >= pagination.totalPages" @click="loadData(page + 1)">下一页</button>
        <button class="btn btn-secondary btn-sm" :disabled="page >= pagination.totalPages" @click="loadData(pagination.totalPages)">末页</button>
        <input v-model.number="jumpPage" type="number" min="1" :max="pagination.totalPages || 1" class="form-control" style="max-width:90px" />
        <button class="btn btn-secondary btn-sm" @click="goJump">跳转</button>
      </div>
    </div>

    <div v-if="showForm" class="modal-overlay" @click.self="showForm = false">
      <div class="modal modal-lg">
        <div class="modal-header">
          <h3>{{ editing ? '编辑新闻' : '发布新闻' }}</h3>
          <button class="modal-close" @click="showForm = false">&times;</button>
        </div>
        <div class="modal-body">
          <div v-if="formError" class="alert alert-error">{{ formError }}</div>
          <div class="form-group">
            <label>新闻标题 *</label>
            <input v-model="form.title" class="form-control" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>分类 *</label>
              <select v-model="form.category_id" class="form-control">
                <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>作者</label>
              <input v-model="form.author" class="form-control" />
            </div>
          </div>
          <div class="form-group">
            <label>简短描述</label>
            <textarea v-model="form.short_desc" class="form-control" rows="2" />
          </div>
          <div class="form-group">
            <label>新闻内容（HTML） *</label>
            <textarea v-model="form.content" class="form-control" rows="8" />
          </div>
          <div class="form-group">
            <label>封面图</label>
            <ImageUploadField v-model="form.cover_image" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>发布时间</label>
              <input v-model="form.publish_time" type="datetime-local" class="form-control" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>置顶</label>
              <select v-model="form.is_top" class="form-control">
                <option :value="1">是</option>
                <option :value="0">否</option>
              </select>
            </div>
            <div class="form-group">
              <label>状态</label>
              <select v-model="form.status" class="form-control">
                <option :value="1">发布</option>
                <option :value="0">草稿</option>
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
import { getNewsCategories, getNewsList, getNewsById, createNews, updateNews, deleteNews, reorderNews } from '@/api'
import { confirmAction, STATUS_MAP } from '@/utils/helpers'
import ImageUploadField from '@/components/ImageUploadField.vue'

const loading = ref(false)
const saving = ref(false)
const showForm = ref(false)
const formError = ref('')
const editing = ref(null)
const list = ref([])
const categories = ref([])
const keyword = ref('')
const filterCategory = ref('')
const page = ref(1)
const pagination = ref({ total: 0, totalPages: 1 })
const pageSize = ref(20)
const jumpPage = ref(1)

const defaultForm = () => ({
  category_id: '', title: '', short_desc: '', content: '', cover_image: '',
  author: '诺元智合', publish_time: '', is_top: 0, status: 1,
})
const form = ref(defaultForm())
const dragId = ref(null)

function formatDate(d) { return d ? new Date(d).toLocaleString('zh-CN') : '-' }
function getCategoryName(id) { return categories.value.find((c) => c.id === id)?.name || id }

function toLocalDatetime(d) {
  if (!d) return ''
  const date = new Date(d)
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

async function loadData(p = page.value) {
  loading.value = true
  page.value = p
  try {
    const params = { page: p, pageSize: pageSize.value, keyword: keyword.value }
    if (filterCategory.value) params.categoryId = filterCategory.value
    const data = await getNewsList(params)
    list.value = data.list
    pagination.value = data.pagination
  } catch (e) { alert(e.message) }
  finally { loading.value = false }
}

async function openForm(item = null) {
  editing.value = item
  if (item) {
    try {
      const data = await getNewsById(item.id)
      form.value = { ...data, sort: undefined, publish_time: toLocalDatetime(data.publish_time) }
    } catch (e) { alert(e.message); return }
  } else {
    form.value = defaultForm()
    if (categories.value.length) form.value.category_id = categories.value[0].id
  }
  formError.value = ''
  showForm.value = true
}

async function handleSave() {
  if (!form.value.title || !form.value.content || !form.value.category_id) {
    formError.value = '请填写必填项'; return
  }
  saving.value = true
  const payload = { ...form.value }
  if (payload.publish_time) payload.publish_time = new Date(payload.publish_time).toISOString().slice(0, 19).replace('T', ' ')
  try {
    if (editing.value) await updateNews(editing.value.id, payload)
    else await createNews(payload)
    showForm.value = false
    await loadData()
  } catch (e) { formError.value = e.message }
  finally { saving.value = false }
}

async function handleDelete(item) {
  if (!confirmAction(`确定删除新闻「${item.title}」吗？`)) return
  try { await deleteNews(item.id); await loadData() }
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
    await reorderNews({ orderIds: rows.map((item) => item.id) })
    await loadData()
  } catch (e) {
    alert(e.message)
  }
  dragId.value = null
}

onMounted(async () => {
  categories.value = await getNewsCategories()
  await loadData()
})

function goJump() {
  const t = Number(jumpPage.value || 1)
  const safe = Math.min(Math.max(t, 1), pagination.value.totalPages || 1)
  loadData(safe)
}

</script>

<style scoped>
.drag-handle { color: #2563eb; font-size: 12px; cursor: grab; }
.upload-box { border: 1px dashed #cbd5e1; border-radius: 8px; padding: 10px; }
.preview { margin-top: 8px; max-width: 120px; border-radius: 6px; display: block; }
</style>
