<template>
  <div>
    <div class="page-header">
      <div>
        <h2>页面管理</h2>
        <p class="desc">管理各导航子页面的富文本内容</p>
      </div>
      <button class="btn btn-primary" @click="openForm()">新增页面</button>
    </div>

    <div class="toolbar">
      <input v-model="keyword" class="form-control" style="max-width:240px" placeholder="搜索标题/导航名" @keyup.enter="loadData(1)" />
      <button class="btn btn-secondary" @click="loadData(1)">搜索</button>
    </div>

    <div class="card">
      <div v-if="loading" class="empty-state">加载中...</div>
      <div v-else-if="!list.length" class="empty-state">暂无页面</div>
      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>标题</th>
              <th>导航名称</th>
              <th>状态</th>
              <th>更新时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in list" :key="item.id">
              <td>{{ item.id }}</td>
              <td>{{ item.title }}</td>
              <td>{{ item.nav_name }}</td>
              <td><span :class="['tag', STATUS_MAP[item.status]?.class]">{{ STATUS_MAP[item.status]?.label }}</span></td>
              <td>{{ formatDate(item.updated_at) }}</td>
              <td class="actions">
                <button class="btn btn-secondary btn-sm" @click="openForm(item)">编辑</button>
                <button class="btn btn-danger btn-sm" @click="handleDelete(item)">删除</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="pagination.totalPages > 1" class="pagination">
        <button class="btn btn-secondary btn-sm" :disabled="page <= 1" @click="loadData(page - 1)">上一页</button>
        <span>第 {{ page }} / {{ pagination.totalPages }} 页，共 {{ pagination.total }} 条</span>
        <button class="btn btn-secondary btn-sm" :disabled="page >= pagination.totalPages" @click="loadData(page + 1)">下一页</button>
      </div>
    </div>

    <div v-if="showForm" class="modal-overlay" @click.self="showForm = false">
      <div class="modal modal-lg">
        <div class="modal-header">
          <h3>{{ editing ? '编辑页面' : '新增页面' }}</h3>
          <button class="modal-close" @click="showForm = false">&times;</button>
        </div>
        <div class="modal-body">
          <div v-if="formError" class="alert alert-error">{{ formError }}</div>
          <div class="form-row">
            <div class="form-group">
              <label>页面标题 *</label>
              <input v-model="form.title" class="form-control" />
            </div>
            <div class="form-group">
              <label>导航名称 *</label>
              <input v-model="form.nav_name" class="form-control" />
            </div>
          </div>
          <div class="form-group">
            <label>封面图</label>
            <ImageUploadField v-model="form.cover_image" />
          </div>
          <div class="form-group">
            <label>页面内容（支持 HTML）</label>
            <textarea v-model="form.content" class="form-control" rows="8" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>SEO 关键词</label>
              <input v-model="form.seo_keywords" class="form-control" />
            </div>
            <div class="form-group">
              <label>状态</label>
              <select v-model="form.status" class="form-control">
                <option :value="1">启用</option>
                <option :value="0">禁用</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>SEO 描述</label>
            <textarea v-model="form.seo_description" class="form-control" rows="2" />
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
import { getPageList, getPageById, createPage, updatePage, deletePage } from '@/api'
import { confirmAction, STATUS_MAP } from '@/utils/helpers'
import ImageUploadField from '@/components/ImageUploadField.vue'

const loading = ref(false)
const saving = ref(false)
const showForm = ref(false)
const formError = ref('')
const editing = ref(null)
const list = ref([])
const keyword = ref('')
const page = ref(1)
const pagination = ref({ total: 0, totalPages: 1 })

const defaultForm = () => ({
  title: '', nav_name: '', content: '', seo_keywords: '', seo_description: '', cover_image: '', status: 1,
})
const form = ref(defaultForm())

function formatDate(d) {
  return d ? new Date(d).toLocaleString('zh-CN') : '-'
}

async function loadData(p = page.value) {
  loading.value = true
  page.value = p
  try {
    const data = await getPageList({ page: p, pageSize: 15, keyword: keyword.value })
    list.value = data.list
    pagination.value = data.pagination
  } catch (e) {
    alert(e.message)
  } finally {
    loading.value = false
  }
}

async function openForm(item = null) {
  editing.value = item
  if (item) {
    try {
      form.value = await getPageById(item.id)
    } catch (e) {
      alert(e.message)
      return
    }
  } else {
    form.value = defaultForm()
  }
  formError.value = ''
  showForm.value = true
}

async function handleSave() {
  if (!form.value.title || !form.value.nav_name) { formError.value = '请填写标题和导航名称'; return }
  saving.value = true
  formError.value = ''
  try {
    if (editing.value) {
      await updatePage(editing.value.id, form.value)
    } else {
      await createPage(form.value)
    }
    showForm.value = false
    await loadData()
  } catch (e) {
    formError.value = e.message
  } finally {
    saving.value = false
  }
}

async function handleDelete(item) {
  if (!confirmAction(`确定删除页面「${item.title}」吗？`)) return
  try {
    await deletePage(item.id)
    await loadData()
  } catch (e) {
    alert(e.message)
  }
}

onMounted(() => loadData())
</script>
