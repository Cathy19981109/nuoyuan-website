<template>
  <div>
    <div class="page-header">
      <div>
        <h2>应用领域</h2>
        <p class="desc">管理网站展示的应用领域板块</p>
      </div>
      <button class="btn btn-primary" @click="openForm()">新增领域</button>
    </div>

    <div class="card">
      <div v-if="loading" class="empty-state">加载中...</div>
      <div v-else-if="!list.length" class="empty-state">暂无数据</div>
      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr><th>ID</th><th>名称</th><th>描述</th><th>排序</th><th>状态</th><th>操作</th></tr>
          </thead>
          <tbody>
            <tr v-for="item in list" :key="item.id">
              <td>{{ item.id }}</td>
              <td>{{ item.name }}</td>
              <td>{{ item.description || '-' }}</td>
              <td>{{ item.sort }}</td>
              <td><span :class="['tag', STATUS_MAP[item.status]?.class]">{{ STATUS_MAP[item.status]?.label }}</span></td>
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
          <h3>{{ editing ? '编辑领域' : '新增领域' }}</h3>
          <button class="modal-close" @click="showForm = false">&times;</button>
        </div>
        <div class="modal-body">
          <div v-if="formError" class="alert alert-error">{{ formError }}</div>
          <div class="form-group">
            <label>领域名称 *</label>
            <input v-model="form.name" class="form-control" />
          </div>
          <div class="form-group">
            <label>简短描述</label>
            <input v-model="form.description" class="form-control" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>图标</label>
              <ImageUploadField v-model="form.icon" />
            </div>
            <div class="form-group">
              <label>封面图</label>
              <ImageUploadField v-model="form.cover_image" />
            </div>
          </div>
          <div class="form-group">
            <label>详细内容（HTML）</label>
            <textarea v-model="form.content" class="form-control" rows="6" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>排序</label>
              <input v-model.number="form.sort" type="number" class="form-control" />
            </div>
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
import { getApplicationList, getApplicationById, createApplication, updateApplication, deleteApplication } from '@/api'
import { confirmAction, STATUS_MAP } from '@/utils/helpers'
import ImageUploadField from '@/components/ImageUploadField.vue'

const loading = ref(false)
const saving = ref(false)
const showForm = ref(false)
const formError = ref('')
const editing = ref(null)
const list = ref([])
const page = ref(1)
const pagination = ref({ total: 0, totalPages: 1 })
const defaultForm = () => ({ name: '', description: '', icon: '', cover_image: '', content: '', sort: 0, status: 1 })
const form = ref(defaultForm())

async function loadData(p = page.value) {
  loading.value = true
  page.value = p
  try {
    const data = await getApplicationList({ page: p, pageSize: 15 })
    list.value = data.list
    pagination.value = data.pagination
  } catch (e) { alert(e.message) }
  finally { loading.value = false }
}

async function openForm(item = null) {
  editing.value = item
  if (item) {
    try { form.value = await getApplicationById(item.id) }
    catch (e) { alert(e.message); return }
  } else {
    form.value = defaultForm()
  }
  formError.value = ''
  showForm.value = true
}

async function handleSave() {
  if (!form.value.name) { formError.value = '请填写领域名称'; return }
  saving.value = true
  try {
    if (editing.value) await updateApplication(editing.value.id, form.value)
    else await createApplication(form.value)
    showForm.value = false
    await loadData()
  } catch (e) { formError.value = e.message }
  finally { saving.value = false }
}

async function handleDelete(item) {
  if (!confirmAction(`确定删除「${item.name}」吗？`)) return
  try { await deleteApplication(item.id); await loadData() }
  catch (e) { alert(e.message) }
}

onMounted(() => loadData())
</script>
