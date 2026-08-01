<template>
  <div>
    <div class="footer-editor-sticky">
      <div class="page-header">
        <div>
          <h2>底部导航编辑</h2>
          <p class="desc">配置页脚多栏跳转链接，以及版权与备案信息</p>
        </div>
        <div class="toolbar">
          <button class="btn btn-secondary" @click="openPreview">前台预览</button>
          <button class="btn btn-primary" @click="openCreate">新增栏目</button>
        </div>
      </div>
    </div>

    <div class="page-header section-header">
      <div>
        <h2>页脚底栏信息</h2>
        <p class="desc">版权、备案号等，显示在页脚最下方</p>
      </div>
      <button class="btn btn-primary" :disabled="metaSaving" @click="saveMeta">
        {{ metaSaving ? '保存中...' : '保存' }}
      </button>
    </div>

    <div class="card section-card">
      <div v-if="metaLoading" class="empty-state">加载中...</div>
      <div v-else class="meta-form">
        <div class="form-group">
          <label>底部版权文字</label>
          <input
            v-model="meta.footer_copyright"
            class="form-control"
            maxlength="200"
            placeholder="© 2026 诺元智合 NUOYUAN BIOTECH. All rights reserved."
          />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>ICP备案号</label>
            <input
              v-model="meta.icp_no"
              class="form-control"
              maxlength="50"
              placeholder="如：苏ICP备xxxxxxxx号-1"
            />
            <div class="hint">链接至工信部备案查询</div>
          </div>
          <div class="form-group">
            <label>公安备案号</label>
            <input
              v-model="meta.footer_police_beian"
              class="form-control"
              maxlength="80"
              placeholder="如：苏公网安备 xxxxxxxxxx号"
            />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>营业执照文案</label>
            <input
              v-model="meta.footer_license_text"
              class="form-control"
              maxlength="40"
              placeholder="营业执照"
            />
          </div>
          <div class="form-group">
            <label>营业执照链接</label>
            <input
              v-model="meta.footer_license_url"
              class="form-control"
              maxlength="300"
              placeholder="https://..."
            />
          </div>
        </div>
        <div class="form-group">
          <label>底栏补充说明</label>
          <input
            v-model="meta.footer_region_note"
            class="form-control"
            maxlength="100"
            placeholder="如：本网站所有信息仅针对中国地区客户"
          />
        </div>
      </div>
    </div>

    <div class="page-header section-header">
      <div>
        <h2>页脚栏目</h2>
        <p class="desc">可自由新增栏目；每个栏目配置跳转链接（站内路径或外链）</p>
      </div>
      <button class="btn btn-primary" @click="openCreate">新增栏目</button>
    </div>

    <div class="card section-card">
      <div v-if="loading" class="empty-state">加载中...</div>
      <div v-else-if="!rows.length" class="empty-state">
        <p>暂无页脚栏目</p>
        <button class="btn btn-primary btn-sm" style="margin-top:12px" @click="openCreate">新增栏目</button>
      </div>
      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>栏目标题</th>
              <th>链接数</th>
              <th>拖拽排序</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
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
              <td>{{ Array.isArray(row.links_json) ? row.links_json.length : 0 }}</td>
              <td><span class="drag-handle">⇅ 拖拽</span></td>
              <td>
                <span :class="['tag', row.status ? 'tag-success' : 'tag-danger']">
                  {{ row.status ? '显示' : '隐藏' }}
                </span>
              </td>
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
            <label><span class="required">*</span>栏目标题</label>
            <input v-model="form.title" class="form-control" placeholder="如：快速链接、联系我们、关于我们" />
          </div>
          <div class="form-group">
            <label>栏目链接</label>
            <div v-for="(link, idx) in links" :key="idx" class="link-row">
              <input v-model="link.text" class="form-control" placeholder="链接文字" />
              <input v-model="link.url" class="form-control" placeholder="跳转地址，如 /products 或 https://..." />
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
          <button class="btn btn-primary" :disabled="saving" @click="saveRow">
            {{ saving ? '保存中...' : '保存' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import {
  getFooterBlocks,
  createFooterBlock,
  updateFooterBlock,
  deleteFooterBlock,
  getSiteCenter,
  saveSiteCenter,
} from '@/api'

const loading = ref(false)
const metaLoading = ref(false)
const metaSaving = ref(false)
const rows = ref([])
const showForm = ref(false)
const editing = ref(null)
const saving = ref(false)
const links = ref([])
const dragId = ref(null)
const meta = ref({
  footer_copyright: '',
  icp_no: '',
  footer_police_beian: '',
  footer_license_text: '',
  footer_license_url: '',
  footer_region_note: '',
})
const form = ref({
  title: '',
  layout_type: 1,
  qrcode_image: '',
  copyright_text: '',
  sort: 0,
  status: 1,
})

function pickMetaFromGroups(groups = []) {
  const items = (groups || []).flatMap((g) => g.items || [])
  const map = Object.fromEntries(items.map((i) => [i.key, i.value || '']))
  meta.value = {
    footer_copyright: map.footer_copyright || '',
    icp_no: map.icp_no || '',
    footer_police_beian: map.footer_police_beian || '',
    footer_license_text: map.footer_license_text || '',
    footer_license_url: map.footer_license_url || '',
    footer_region_note: map.footer_region_note || '',
  }
}

async function loadMeta() {
  metaLoading.value = true
  try {
    const groups = await getSiteCenter()
    pickMetaFromGroups(groups)
  } catch (e) {
    alert(e.message)
  } finally {
    metaLoading.value = false
  }
}

async function saveMeta() {
  metaSaving.value = true
  try {
    await saveSiteCenter({
      footer_copyright: String(meta.value.footer_copyright || '').trim(),
      icp_no: String(meta.value.icp_no || '').trim(),
      footer_police_beian: String(meta.value.footer_police_beian || '').trim(),
      footer_license_text: String(meta.value.footer_license_text || '').trim(),
      footer_license_url: String(meta.value.footer_license_url || '').trim(),
      footer_region_note: String(meta.value.footer_region_note || '').trim(),
    })
    alert('底栏信息已保存')
    await loadMeta()
  } catch (e) {
    alert(e.message)
  } finally {
    metaSaving.value = false
  }
}

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

function nextSort() {
  if (!rows.value.length) return 0
  return Math.max(...rows.value.map((r) => Number(r.sort) || 0)) + 1
}

function openCreate() {
  editing.value = null
  form.value = {
    title: '',
    layout_type: 1,
    qrcode_image: '',
    copyright_text: '',
    sort: nextSort(),
    status: 1,
  }
  links.value = [{ text: '', url: '' }]
  showForm.value = true
}

function editRow(row) {
  editing.value = row
  form.value = {
    title: row.title || '',
    layout_type: row.layout_type || 1,
    qrcode_image: row.qrcode_image || '',
    copyright_text: row.copyright_text || '',
    sort: row.sort || 0,
    status: row.status || 1,
  }
  links.value = Array.isArray(row.links_json) && row.links_json.length
    ? row.links_json.map((l) => ({ text: l.text || '', url: l.url || '' }))
    : [{ text: '', url: '' }]
  showForm.value = true
}

async function saveRow() {
  if (!form.value.title) return alert('请填写栏目标题')
  saving.value = true
  try {
    const cleanLinks = links.value
      .map((l) => ({ text: String(l.text || '').trim(), url: String(l.url || '').trim() }))
      .filter((l) => l.text || l.url)
    const payload = {
      ...form.value,
      layout_type: 1,
      qrcode_image: '',
      links: cleanLinks,
    }
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
  window.open('http://localhost:5173/?preview=1', '_blank')
}

onMounted(async () => {
  await Promise.all([loadMeta(), loadData()])
})
</script>

<style scoped>
.footer-editor-sticky {
  position: sticky;
  top: calc(var(--header-height) + var(--breadcrumb-height));
  z-index: 40;
  margin: 0 -24px 16px;
  padding: 4px 24px 12px;
  background: var(--color-bg);
  border-bottom: 1px solid var(--color-border);
  box-shadow: 0 8px 16px -12px rgba(15, 23, 42, 0.35);
}
.footer-editor-sticky .page-header {
  margin-bottom: 0;
}
.section-header {
  margin-bottom: 12px;
}
.section-header h2 {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-primary);
}
.section-card {
  margin-bottom: 24px;
}
.meta-form {
  display: grid;
  gap: 12px;
  max-width: 860px;
}
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.required { color: #dc2626; margin-right: 4px; font-weight: 700; }
.drag-handle { color: #2563eb; font-size: 12px; cursor: grab; }
.link-row {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 8px;
  margin-bottom: 8px;
}
.hint {
  margin-top: 6px;
  font-size: 12px;
  color: #64748b;
}
@media (max-width: 768px) {
  .form-row { grid-template-columns: 1fr; }
}
</style>
