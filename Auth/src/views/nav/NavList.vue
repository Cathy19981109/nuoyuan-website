<template>
  <div>
    <div class="page-header">
      <div>
        <h2>顶部导航编辑</h2>
        <p class="desc">管理网站顶部导航菜单（仅顶级菜单，无下拉子菜单）</p>
      </div>
      <button class="btn btn-primary" @click="openForm()">新增导航</button>
    </div>

    <div class="card">
      <div v-if="loading" class="empty-state">加载中...</div>
      <div v-else-if="!list.length" class="empty-state">暂无导航数据</div>
      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>导航名称</th>
              <th>英文名称</th>
              <th>链接</th>
              <th>拖拽排序</th>
              <th>状态</th>
              <th>操作</th>
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
              <td>{{ item.name }}</td>
              <td>{{ item.en_name || '-' }}</td>
              <td>{{ item.link_url || (item.page_id ? `页面#${item.page_id}` : '-') }}</td>
              <td><span class="drag-handle">⇅ 拖拽</span></td>
              <td><span :class="['tag', STATUS_MAP[item.status]?.class]">{{ STATUS_MAP[item.status]?.label }}</span></td>
              <td class="actions">
                <button class="btn btn-secondary btn-sm" @click="goEditPage(item)">编辑</button>
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
          <h3>{{ editing ? '编辑导航' : '新增导航' }}</h3>
          <button class="modal-close" @click="showForm = false">&times;</button>
        </div>
        <div class="modal-body">
          <div v-if="formError" class="alert alert-error">{{ formError }}</div>
          <div class="form-row">
            <div class="form-group">
              <label>导航名称 *</label>
              <input v-model="form.name" class="form-control" />
            </div>
            <div class="form-group">
              <label>英文名称</label>
              <input v-model="form.en_name" class="form-control" />
            </div>
          </div>
          <div class="form-group">
            <label>关联页面ID</label>
            <input v-model.number="form.page_id" type="number" class="form-control" placeholder="可选" />
          </div>
          <div class="form-group">
            <label>自定义链接</label>
            <input v-model="form.link_url" class="form-control" placeholder="如 /products，留空则使用页面ID" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>打开方式</label>
              <select v-model="form.target" class="form-control">
                <option value="_self">当前窗口</option>
                <option value="_blank">新窗口</option>
              </select>
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
import { useRouter } from 'vue-router'
import { getNavList, createNav, updateNav, deleteNav, reorderNav } from '@/api'
import { confirmAction, STATUS_MAP } from '@/utils/helpers'

const router = useRouter()
const loading = ref(false)
const saving = ref(false)
const showForm = ref(false)
const formError = ref('')
const editing = ref(null)
const list = ref([])

const defaultForm = () => ({
  name: '', en_name: '', page_id: null, link_url: '',
  target: '_self', sort: 0, status: 1,
})
const form = ref(defaultForm())
const dragId = ref(null)

const navNameToPageKey = {
  首页: 'home',
  产品中心: 'products',
  技术服务: 'services',
  应用领域: 'applications',
  新闻动态: 'news',
  关于我们: 'about',
  联系我们: 'contact',
}

async function loadData() {
  loading.value = true
  try {
    const rows = await getNavList()
    list.value = Array.isArray(rows) ? rows : []
  } catch (e) {
    alert(e.message)
  } finally {
    loading.value = false
  }
}

/** 跳转到页面编辑，并定位到对应导航页 */
function goEditPage(item) {
  const query = {}
  if (item?.page_id) query.pageId = String(item.page_id)
  if (item?.name) query.name = item.name
  const key = navNameToPageKey[item?.name]
  if (key) query.pageKey = key
  router.push({ name: 'PageEditor', query })
}

function openForm(item = null) {
  editing.value = item
  form.value = item
    ? {
        name: item.name || '',
        en_name: item.en_name || '',
        page_id: item.page_id || null,
        link_url: item.link_url || '',
        target: item.target || '_self',
        sort: item.sort || 0,
        status: item.status ?? 1,
      }
    : defaultForm()
  formError.value = ''
  showForm.value = true
}

async function handleSave() {
  if (!form.value.name) { formError.value = '请填写导航名称'; return }
  if (String(form.value.name || '').length > 4) {
    formError.value = '导航名称最多4个字'
    return
  }
  saving.value = true
  formError.value = ''
  try {
    const payload = {
      ...form.value,
      parent_id: 0,
      page_id: form.value.page_id || null,
      link_url: form.value.link_url || null,
    }
    if (editing.value) await updateNav(editing.value.id, payload)
    else await createNav(payload)
    showForm.value = false
    await loadData()
  } catch (e) {
    formError.value = e.message
  } finally {
    saving.value = false
  }
}

async function handleDelete(item) {
  if (!confirmAction(`确定删除导航「${item.name}」吗？`)) return
  try {
    await deleteNav(item.id)
    await loadData()
  } catch (e) {
    alert(e.message)
  }
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
    await reorderNav({ orderIds: rows.map((r) => r.id) })
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
