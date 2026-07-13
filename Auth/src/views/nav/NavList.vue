<template>
  <div>
    <div class="page-header">
      <div>
        <h2>导航管理</h2>
        <p class="desc">管理网站顶部导航菜单及子菜单</p>
      </div>
      <button class="btn btn-primary" @click="openForm()">新增导航</button>
    </div>

    <div class="card">
      <div v-if="loading" class="empty-state">加载中...</div>
      <div v-else-if="!visibleList.length" class="empty-state">暂无导航数据</div>
      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>导航结构</th>
              <th>英文名称</th>
              <th>链接</th>
              <th>下拉横幅图</th>
              <th>拖拽排序</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in visibleList"
              :key="item.id"
              draggable="true"
              @dragstart="onDragStart(item.id)"
              @dragover.prevent
              @drop="onDrop(item.id)"
            >
              <td>
                <div class="tree-cell" :style="{ paddingLeft: item.depth * 20 + 'px' }">
                  <button v-if="hasChildren(item)" type="button" class="expand-btn" @click="toggleExpand(item.id)">
                    {{ expandedMap[item.id] ? '▾' : '▸' }}
                  </button>
                  <span v-else class="expand-placeholder">•</span>
                  <span :class="['menu-name', `menu-name-level-${getLevel(item)}`]">{{ item.name }}</span>
                  <span :class="['level-chip', `level-chip-${getLevel(item)}`]">{{ levelText(item) }}</span>
                </div>
              </td>
              <td>{{ item.en_name || '-' }}</td>
              <td>{{ item.link_url || (item.page_id ? `页面#${item.page_id}` : '-') }}</td>
              <td>{{ item.dropdown_banner ? '已设置' : '-' }}</td>
              <td><span class="drag-handle">⇅ 拖拽</span></td>
              <td><span :class="['tag', STATUS_MAP[item.status]?.class]">{{ STATUS_MAP[item.status]?.label }}</span></td>
              <td class="actions">
                <button class="btn btn-secondary btn-sm" @click="openCreateUnder(item)">新增分类</button>
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
          <div class="form-row">
            <div class="form-group">
              <label>父级导航</label>
              <select v-model="form.parent_id" class="form-control">
                <option :value="0">顶级导航</option>
                <option v-for="n in topNavOptions" :key="n.id" :value="n.id">{{ n.name }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>关联页面ID</label>
              <input v-model.number="form.page_id" type="number" class="form-control" placeholder="可选" />
            </div>
          </div>
          <div class="form-group">
            <label>自定义链接</label>
            <input v-model="form.link_url" class="form-control" placeholder="如 /products，留空则使用页面ID" />
          </div>
          <div class="form-group">
            <label>下拉面板横幅图</label>
            <ImageUploadField
              v-model="form.dropdown_banner"
              :upload-fn="uploadBanner"
              hint-text="横幅建议16:6，推荐1920x720，png/jpg/webp，<=50MB"
            />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>打开方式</label>
              <select v-model="form.target" class="form-control">
                <option value="_self">当前窗口</option>
                <option value="_blank">新窗口</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>状态</label>
            <select v-model="form.status" class="form-control">
              <option :value="1">显示</option>
              <option :value="0">隐藏</option>
            </select>
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
import { getNavList, createNav, updateNav, deleteNav, reorderNav, uploadImageFile } from '@/api'
import { flattenTree, confirmAction, STATUS_MAP } from '@/utils/helpers'
import ImageUploadField from '@/components/ImageUploadField.vue'

const loading = ref(false)
const saving = ref(false)
const showForm = ref(false)
const formError = ref('')
const editing = ref(null)
const tree = ref([])
const expandedMap = ref({})

const defaultForm = () => ({
  parent_id: 0, name: '', en_name: '', page_id: null, link_url: '', dropdown_banner: '',
  target: '_self', sort: 0, status: 1,
})
const form = ref(defaultForm())
const dragId = ref(null)

const allNodes = computed(() => flattenTree(tree.value))
const topNavOptions = computed(() => allNodes.value.filter((n) => !editing.value || n.id !== editing.value.id))
const visibleList = computed(() => {
  const rows = []
  const walk = (nodes = [], depth = 0) => {
    nodes.forEach((node) => {
      rows.push({ ...node, depth })
      if (node.children?.length && expandedMap.value[node.id]) walk(node.children, depth + 1)
    })
  }
  walk(tree.value, 0)
  return rows
})

function getLevel(item) {
  return Number(item.depth || 0) + 1
}

function levelText(item) {
  const level = getLevel(item)
  if (level <= 1) return '一级菜单'
  if (level === 2) return '二级菜单'
  return '三级菜单'
}

function hasChildren(item) {
  return Array.isArray(item.children) && item.children.length > 0
}

function toggleExpand(id) {
  expandedMap.value[id] = !expandedMap.value[id]
}

async function loadData() {
  loading.value = true
  try {
    tree.value = await getNavList()
    const next = {}
    flattenTree(tree.value).forEach((node) => {
      if (node.children?.length) next[node.id] = false
    })
    expandedMap.value = next
  } catch (e) {
    alert(e.message)
  } finally {
    loading.value = false
  }
}

function openForm(item = null) {
  editing.value = item
  form.value = item ? { ...item, page_id: item.page_id || null } : defaultForm()
  formError.value = ''
  showForm.value = true
}

function openCreateUnder(item) {
  editing.value = null
  form.value = { ...defaultForm(), parent_id: item.id }
  formError.value = ''
  showForm.value = true
}

async function handleSave() {
  if (!form.value.name) { formError.value = '请填写导航名称'; return }
  if (String(form.value.name || '').length > 4 && form.value.parent_id === 0) {
    formError.value = '主导航名称最多4个字'
    return
  }
  if (String(form.value.name || '').length > 8 && form.value.parent_id !== 0) {
    formError.value = '子菜单名称最多8个字'
    return
  }
  saving.value = true
  formError.value = ''
  try {
    const payload = { ...form.value, page_id: form.value.page_id || null, link_url: form.value.link_url || null }
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

function parseBannerRule() {
  return { allowedTypes: ['image/png', 'image/jpeg', 'image/webp'], maxSize: 50 * 1024 * 1024, ratio: 16 / 6 }
}

function getImageSize(file) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.width, height: img.height })
    img.onerror = () => resolve({ width: 0, height: 0 })
    img.src = URL.createObjectURL(file)
  })
}

async function uploadBanner(file) {
  if (!file) return ''
  const rule = parseBannerRule()
  if (!rule.allowedTypes.includes(file.type)) throw new Error('只支持 png/jpg/webp 格式')
  if (file.size > rule.maxSize) throw new Error('图片不能超过 50MB')
  const size = await getImageSize(file)
  const ratio = size.width && size.height ? size.width / size.height : 0
  if (Math.abs(ratio - rule.ratio) > 0.2) throw new Error('图片比例需接近 16:6')
  const fd = new FormData()
  fd.append('file', file)
  const res = await uploadImageFile(fd)
  return res.url
}

function onDragStart(id) {
  dragId.value = id
}

async function onDrop(targetId) {
  if (!dragId.value || dragId.value === targetId) return
  const rows = visibleList.value.slice()
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
.tree-cell { display: flex; align-items: center; gap: 8px; min-height: 28px; }
.expand-btn {
  width: 18px;
  height: 18px;
  border: none;
  background: transparent;
  color: #334155;
  cursor: pointer;
  padding: 0;
}
.expand-placeholder { width: 18px; color: #cbd5e1; text-align: center; }
.level-chip {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}
.level-chip-1 { background: #dcfce7; color: #166534; }
.level-chip-2 { background: #dbeafe; color: #1e40af; }
.level-chip-3 { background: #f3e8ff; color: #6b21a8; }
.menu-name { display: inline-block; line-height: 1.3; }
.menu-name-level-1 { font-size: 15px; font-weight: 600; color: #0f172a; }
.menu-name-level-2 { font-size: 13px; font-weight: 500; color: #1e293b; }
.menu-name-level-3 { font-size: 12px; font-weight: 500; color: #475569; }
</style>
