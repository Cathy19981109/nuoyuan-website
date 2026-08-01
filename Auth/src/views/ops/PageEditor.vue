<template>
  <div>
    <div class="page-header">
      <div>
        <h2>页面编辑</h2>
        <p class="desc">先选择页面，再编辑导航信息或页面内容模块</p>
      </div>
    </div>

    <div class="card" style="margin-bottom: 16px">
      <div class="tabs-head">
        <div class="tabs-scroll">
          <button
            v-for="item in pageTabs"
            :key="item.id"
            class="tab-btn"
            :class="{ active: activePage?.id === item.id }"
            draggable="true"
            @click="selectPage(item)"
            @dragstart="onTabDragStart(item.id)"
            @dragover.prevent
            @drop="onTabDrop(item.id)"
          >
            {{ item.title }}
          </button>
        </div>
        <button class="btn btn-secondary btn-sm" @click="openPageDialog()">新增页面</button>
      </div>
    </div>

    <div class="card" v-if="activePage" style="margin-bottom: 16px">
      <div class="tabs-head">
        <button class="tab-btn" :class="{ active: activeInnerTab === 'nav' }" @click="activeInnerTab = 'nav'">导航信息</button>
        <button class="tab-btn" :class="{ active: activeInnerTab === 'content' }" @click="activeInnerTab = 'content'">导航内容</button>
      </div>
      <div v-if="activeInnerTab === 'nav'" style="margin-top: 12px">
        <div class="form-row">
          <div class="form-group">
            <label><span class="required">*</span> 导航名称</label>
            <input v-model="navForm.name" class="form-control" />
          </div>
          <div class="form-group">
            <label>英文名称</label>
            <input v-model="navForm.en_name" class="form-control" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>打开方式</label>
            <select v-model="navForm.target" class="form-control">
              <option value="_self">当前窗口</option>
              <option value="_blank">新窗口</option>
            </select>
          </div>
          <div class="form-group">
            <label>显示状态</label>
            <select v-model="navForm.status" class="form-control">
              <option :value="1">显示</option>
              <option :value="0">隐藏</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>自定义链接（可选）</label>
          <input v-model="navForm.link_url" class="form-control" />
        </div>
        <div class="toolbar">
          <button class="btn btn-secondary" @click="openPageDialog(activePage)">编辑页面</button>
          <button class="btn btn-danger" @click="removePage(activePage)">删除页面</button>
          <button class="btn btn-primary" :disabled="savingNav" @click="saveNavInfo">{{ savingNav ? '保存中...' : '保存导航信息' }}</button>
        </div>
      </div>
    </div>

    <template v-if="activePage && activeInnerTab === 'content'">
      <div class="page-header">
        <div>
          <h2>{{ activePage.title }}内容模块</h2>
          <p class="desc">可自由新增模块，删除后进入回收站保留30天</p>
        </div>
        <div class="toolbar">
          <button class="btn btn-secondary" @click="openPreview">前台预览</button>
          <button class="btn btn-primary" @click="openCreate">新增模块</button>
        </div>
      </div>

    <div class="card">
      <div class="toolbar" style="margin-bottom: 12px">
        <span class="tag tag-info">页面：{{ pageLabel }}</span>
      </div>
      <div v-if="loading" class="empty-state">加载中...</div>
      <div v-else-if="!modules.length" class="empty-state">暂未添加模块</div>
      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>模块序号</th>
              <th>模块名称</th>
              <th>模板类型</th>
              <th>前台展示位置</th>
              <th>拖拽排序</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in modules"
              :key="item.id"
              draggable="true"
              @dragstart="onDragStart(item.id, 'modules')"
              @dragover.prevent
              @drop="onDrop(item.id, 'modules')"
            >
              <td>#{{ item.module_no }}</td>
              <td>{{ item.module_name }}</td>
              <td>{{ item.module_template }}</td>
              <td>{{ item.front_position || '-' }}</td>
              <td><span class="drag-handle">⇅ 拖拽</span></td>
              <td><span :class="['tag', item.status ? 'tag-success' : 'tag-danger']">{{ item.status ? '显示' : '隐藏' }}</span></td>
              <td class="actions">
                <button class="btn btn-secondary btn-sm" @click="editModule(item)">编辑</button>
                <button class="btn btn-danger btn-sm" @click="removeModule(item)">删除</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <div class="card" style="margin-top: 20px">
      <div class="page-header" style="margin-bottom: 10px">
        <div>
          <h2 style="font-size: 16px">模块回收站</h2>
          <p class="desc">支持按模块序号搜索、恢复或永久清除</p>
        </div>
      </div>
      <div class="toolbar">
        <input v-model="recycleNo" class="form-control" style="max-width: 180px" placeholder="输入模块序号" />
        <button class="btn btn-secondary" @click="loadRecycle">筛选</button>
      </div>
      <div v-if="recycleLoading" class="empty-state">加载中...</div>
      <div v-else-if="!recycleRows.length" class="empty-state">回收站为空</div>
      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr><th>模块序号</th><th>模块名称</th><th>删除时间</th><th>到期时间</th><th>拖拽排序</th><th>操作</th></tr>
          </thead>
          <tbody>
            <tr
              v-for="row in recycleRows"
              :key="row.id"
              draggable="true"
              @dragstart="onDragStart(row.id, 'recycle')"
              @dragover.prevent
              @drop="onDrop(row.id, 'recycle')"
            >
              <td>#{{ row.module_no }}</td>
              <td>{{ row.module_name }}</td>
              <td>{{ formatTime(row.deleted_at) }}</td>
              <td>{{ formatTime(row.expire_at) }}</td>
              <td>
                <span class="drag-handle">⇅ 拖拽</span>
              </td>
              <td class="actions">
                <button class="btn btn-secondary btn-sm" @click="restoreRecycle(row)">恢复</button>
                <button class="btn btn-danger btn-sm" @click="purgeRecycle(row)">永久清除</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="showForm" class="modal-overlay" @click.self="showForm = false">
      <div class="modal modal-lg">
        <div class="modal-header">
          <h3>{{ editing ? '编辑模块' : '新增模块' }}</h3>
          <button class="modal-close" @click="showForm = false">&times;</button>
        </div>
        <div class="modal-body">
          <div v-if="error" class="alert alert-error">{{ error }}</div>
          <div class="form-row">
            <div class="form-group">
              <label><span class="required">*</span> 模块名称</label>
              <input v-model="form.module_name" class="form-control" placeholder="例如：核心服务卡片" />
            </div>
            <div class="form-group">
              <label><span class="required">*</span> 模板类型</label>
              <select v-model="form.module_template" class="form-control">
                <option v-for="tpl in templates" :key="tpl.code" :value="tpl.code">{{ tpl.name }}</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>前台展示位置说明</label>
            <input v-model="form.front_position" class="form-control" placeholder="例如：首页中部第2屏" />
          </div>
          <div class="form-group" v-if="currentTemplateForm.showMainTitle">
            <label><span v-if="currentTemplateForm.mainTitleRequired" class="required">*</span> 主标题</label>
            <input v-model="form.main_title" class="form-control" placeholder="请输入主标题" />
          </div>
          <div class="form-group" v-if="currentTemplateForm.showSubTitle">
            <label><span v-if="currentTemplateForm.subTitleRequired" class="required">*</span> 副标题</label>
            <input v-model="form.sub_title" class="form-control" placeholder="请输入副标题" />
          </div>
          <div class="form-group" v-if="currentTemplateForm.showBodyText">
            <label><span v-if="currentTemplateForm.bodyTextRequired" class="required">*</span> 正文内容</label>
            <textarea v-model="form.body_text" rows="4" class="form-control" placeholder="请输入正文" />
          </div>
          <div class="form-group" v-if="currentTemplateForm.showQuestion">
            <label><span class="required">*</span> 问题</label>
            <input v-model="form.qa_question" class="form-control" placeholder="请输入问题" />
          </div>
          <div class="form-group" v-if="currentTemplateForm.showAnswer">
            <label><span class="required">*</span> 回答</label>
            <textarea v-model="form.qa_answer" rows="3" class="form-control" placeholder="请输入回答" />
          </div>
          <div class="form-group" v-if="currentTemplateForm.showLink">
            <label><span v-if="currentTemplateForm.linkRequired" class="required">*</span> 跳转方式</label>
            <select v-model="form.jump_type" class="form-control">
              <option value="external">外部链接</option>
              <option value="product">绑定产品ID</option>
            </select>
          </div>
          <div class="form-group" v-if="currentTemplateForm.showLink && form.jump_type === 'external'">
            <label><span v-if="currentTemplateForm.linkRequired" class="required">*</span> 外部链接地址</label>
            <input v-model="form.link_url" class="form-control" placeholder="https://example.com" />
          </div>
          <div class="form-group" v-if="currentTemplateForm.showLink && form.jump_type === 'product'">
            <label><span class="required">*</span> 绑定产品5位编号</label>
            <div class="toolbar">
              <input v-model="form.jump_product_code" class="form-control" style="max-width: 220px" placeholder="例如：00012" />
              <button type="button" class="btn btn-secondary btn-sm" @click="searchJumpProduct">检索产品</button>
            </div>
            <div v-if="jumpProductPreview" class="alert" style="background:#eff6ff;color:#1e3a8a">
              已匹配：{{ jumpProductPreview.name }}（ID：{{ jumpProductPreview.product_code }}）
            </div>
          </div>
          <div class="form-group" v-if="currentTemplateForm.showTableText">
            <label><span class="required">*</span> 表格内容</label>
            <textarea v-model="form.table_text" rows="4" class="form-control" placeholder="请输入表格文本内容" />
          </div>
          <div class="form-group" v-if="currentTemplateForm.showImageUploader">
            <label><span v-if="currentTemplateForm.imageRequired" class="required">*</span> 图片上传</label>
            <div v-if="form.module_template === 'multi_image_carousel'" class="carousel-upload-list">
              <div
                v-for="(img, idx) in form.image_list_json"
                :key="idx"
                class="upload-slot"
                draggable="true"
                @dragstart="onImageDragStart(idx)"
                @dragover.prevent
                @drop="onImageDrop(idx)"
              >
                <input type="file" accept=".png,.jpg,.jpeg,.webp" @change="(e) => onSingleImageSlotSelect(e, idx)" />
                <div class="hint">{{ img?.name || `上传位${idx + 1}` }}</div>
                <button type="button" class="btn btn-danger btn-sm" @click="removeImage(idx)">删除</button>
              </div>
              <button type="button" class="btn btn-secondary btn-sm" @click="addImageSlot">+ 新增上传框</button>
            </div>
            <input v-else type="file" :multiple="currentTemplateForm.imageMultiple" accept=".png,.jpg,.jpeg,.webp" @change="onImagesSelect" />
            <div class="hint image-rule">
              {{ activeTemplateRule || '请选择模板查看上传规范' }}
            </div>
            <div class="image-list">
              <div v-for="(img, idx) in form.image_list_json" :key="idx" class="image-chip">
                <a :href="img.url" target="_blank">{{ img.name || `图片${idx + 1}` }}</a>
                <button type="button" class="btn btn-danger btn-sm" @click="removeImage(idx)">删除</button>
              </div>
            </div>
          </div>
          <div class="form-group" v-if="currentTemplateForm.showLayoutMode">
            <label><span class="required">*</span> 图文布局方式</label>
            <select v-model="form.layout_mode" class="form-control">
              <option value="overlay">图内叠加</option>
              <option value="top">图上</option>
              <option value="bottom">图下</option>
              <option value="left">图左</option>
              <option value="right">图右</option>
            </select>
          </div>
          <div class="form-group" v-if="currentTemplateForm.showVideoUploader">
            <label><span class="required">*</span> 视频文件上传</label>
            <input type="file" accept=".mp4" @change="onVideoSelect" />
            <div class="hint">支持16:9，mp4，单文件<=1GB</div>
            <div v-if="form.video_url" class="hint">已选择：{{ form.video_url }}</div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>显示状态</label>
              <select v-model="form.status" class="form-control">
                <option :value="1">显示</option>
                <option :value="0">隐藏</option>
              </select>
            </div>
          </div>
          <div class="alert" style="background: #eff6ff; color: #1e40af">
            当前素材规范：{{ currentRuleText }}
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="openPreview">前台实时预览</button>
          <button class="btn btn-secondary" @click="showForm = false">取消</button>
          <button class="btn btn-primary" :disabled="saving" @click="saveModule">{{ saving ? '保存中...' : '保存模块' }}</button>
        </div>
      </div>
    </div>

    <div v-if="showPageDialog" class="modal-overlay" @click.self="showPageDialog = false">
      <div class="modal">
        <div class="modal-header">
          <h3>{{ editingPage ? '编辑页面' : '新增页面' }}</h3>
          <button class="modal-close" @click="showPageDialog = false">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label><span class="required">*</span> 页面名称</label>
            <input v-model="pageForm.title" class="form-control" />
          </div>
          <div class="form-group">
            <label><span class="required">*</span> 导航标识（英文）</label>
            <input v-model="pageForm.nav_name" class="form-control" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showPageDialog = false">取消</button>
          <button class="btn btn-primary" @click="savePageDialog">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import {
  getPageTemplates, getPageModules, createPageModule, updatePageModule, deletePageModule, reorderPageModules,
  getModuleRecycle, restoreModuleRecycle, purgeModuleRecycle, reorderRecycleModules,
  getEditablePages, createEditablePage, updateEditablePage, deleteEditablePage,
  getNavList, updateNav, createNav, deleteNav, searchProductByCode,
} from '@/api'

const pageTabs = ref([])
const activePage = ref(null)
const activeInnerTab = ref('nav')
const savingNav = ref(false)
const tabDragId = ref(null)
const showPageDialog = ref(false)
const editingPage = ref(null)
const pageForm = ref({ title: '', nav_name: '' })
const navTree = ref([])
const navForm = ref({ id: null, name: '', en_name: '', link_url: '', target: '_self', status: 1 })

const pageKey = computed(() => activePage.value?.nav_name || 'home')
const pageLabel = computed(() => activePage.value?.title || '页面')
const pagePathMap = {
  home: '/',
  products: '/products',
  services: '/services',
  applications: '/applications',
  news: '/news',
  about: '/about',
  contact: '/contact',
}
const loading = ref(false)
const modules = ref([])
const templates = ref([])
const recycleRows = ref([])
const recycleLoading = ref(false)
const recycleNo = ref('')

const showForm = ref(false)
const editing = ref(null)
const saving = ref(false)
const error = ref('')
const form = ref({
  module_name: '', module_template: '', front_position: '', status: 1,
  main_title: '', sub_title: '', body_text: '', link_url: '',
  table_text: '', qa_question: '', qa_answer: '',
  image_list_json: [], card_items_json: [],
})
const dragState = ref({ id: null, area: null })
const imageDragIndex = ref(null)
const jumpProductPreview = ref(null)

const activeTemplateRule = computed(() => {
  const item = templates.value.find((t) => t.code === form.value.module_template)
  return item?.imageRule || ''
})
const currentRuleText = computed(() => {
  if (form.value.module_template === 'image_text_split') {
    const mode = form.value.layout_mode || 'top'
    if (mode === 'top' || mode === 'bottom') return '图上/图下：16:9，1920x720，png/jpg/webp，<=50MB'
    return '图左/图右/图内：4:3，1200x900，png/jpg/webp，<=50MB'
  }
  return activeTemplateRule.value || '请先选择模板'
})

const templateForms = {
  full_width_single_image: { showImageUploader: true, imageRequired: true, imageMultiple: false },
  image_text_split: { showMainTitle: true, mainTitleRequired: true, showBodyText: true, bodyTextRequired: true, showImageUploader: true, imageRequired: true, imageMultiple: false, showLayoutMode: true },
  multi_image_carousel: { showImageUploader: true, imageRequired: true, imageMultiple: true },
  single_video_module: { showMainTitle: true, mainTitleRequired: true, showBodyText: true, bodyTextRequired: true, showVideoUploader: true },
  image_jump_button: { showImageUploader: true, imageRequired: true, imageMultiple: false, showLink: true, linkRequired: true },
}
const currentTemplateForm = computed(() => templateForms[form.value.module_template] || { showImageUploader: true, imageRequired: true, imageMultiple: false })

function formatTime(v) {
  return v ? new Date(v).toLocaleString('zh-CN') : '-'
}

async function loadBase() {
  loading.value = true
  try {
    if (!activePage.value) return
    templates.value = await getPageTemplates(pageKey.value)
    modules.value = await getPageModules(pageKey.value, { includeHidden: 1 })
  } catch (e) {
    alert(e.message)
  } finally {
    loading.value = false
  }
}

async function loadRecycle() {
  recycleLoading.value = true
  try {
    const data = await getModuleRecycle({ pageKey: pageKey.value, moduleNo: recycleNo.value || undefined, pageSize: 50 })
    recycleRows.value = data.list || []
  } catch (e) {
    alert(e.message)
  } finally {
    recycleLoading.value = false
  }
}

async function loadPages() {
  const data = await getEditablePages({ pageSize: 200 })
  const rows = (data.list || []).sort((a, b) => (a.tab_sort || 0) - (b.tab_sort || 0)
    || a.id - b.id)
  pageTabs.value = rows
  if (!activePage.value && rows.length) activePage.value = rows[0]
}

async function loadNavByPage() {
  const allNav = await getNavList()
  navTree.value = flattenNavTree(allNav)
  const found = navTree.value.find((n) => n.page_id === activePage.value?.id)
  navForm.value = found
    ? {
        id: found.id,
        name: found.name || '',
        en_name: found.en_name || '',
        link_url: found.link_url || '',
        target: found.target || '_self',
        status: found.status ?? 1,
      }
    : { id: null, name: activePage.value?.title || '', en_name: '', link_url: '', target: '_self', status: 1 }
}

function flattenNavTree(items = [], out = []) {
  items.forEach((item) => {
    out.push(item)
    if (item.children?.length) flattenNavTree(item.children, out)
  })
  return out
}

async function selectPage(item) {
  activePage.value = item
  activeInnerTab.value = 'nav'
  await loadNavByPage()
  await loadBase()
  await loadRecycle()
}

function openCreate() {
  editing.value = null
  form.value = {
    module_name: '',
    module_template: templates.value[0]?.code || '',
    front_position: '',
    status: 1,
    main_title: '',
    sub_title: '',
    body_text: '',
    link_url: '',
    table_text: '',
    qa_question: '',
    qa_answer: '',
    image_list_json: [],
    card_items_json: [],
    jump_type: 'external',
    jump_product_code: '',
    layout_mode: 'top',
    video_url: '',
  }
  error.value = ''
  showForm.value = true
}

function editModule(item) {
  editing.value = item
  form.value = {
    module_name: item.module_name,
    module_template: item.module_template,
    front_position: item.front_position || '',
    status: item.status,
    main_title: item.main_title || '',
    sub_title: item.sub_title || '',
    body_text: item.body_text || '',
    link_url: item.link_url || '',
    table_text: item.table_text || '',
    qa_question: item.qa_question || '',
    qa_answer: item.qa_answer || '',
    image_list_json: Array.isArray(item.image_list_json) ? item.image_list_json : [],
    card_items_json: Array.isArray(item.card_items_json) ? item.card_items_json : [],
    jump_type: item.jump_type || 'external',
    jump_product_code: item.jump_product_code || '',
    layout_mode: item.layout_mode || 'top',
    video_url: item.video_url || '',
  }
  error.value = ''
  showForm.value = true
}

async function saveModule() {
  if (!form.value.module_name || !form.value.module_template) {
    error.value = '请填写模块名称并选择模板'
    return
  }
  const cfg = currentTemplateForm.value
  if (cfg.mainTitleRequired && !form.value.main_title) return error.value = '请填写主标题'
  if (cfg.bodyTextRequired && !form.value.body_text) return error.value = '请填写正文内容'
  if (cfg.imageRequired && (!form.value.image_list_json || !form.value.image_list_json.length)) return error.value = '请上传必填图片'
  if (cfg.showQuestion && !form.value.qa_question) return error.value = '请填写问题'
  if (cfg.showAnswer && !form.value.qa_answer) return error.value = '请填写回答'
  if (cfg.showTableText && !form.value.table_text) return error.value = '请填写表格内容'
  if (cfg.showCardList && (!form.value.card_items_json || !form.value.card_items_json.length)) return error.value = '请至少添加一张卡片'
  if (cfg.linkRequired && form.value.jump_type === 'external' && !form.value.link_url) return error.value = '请填写跳转链接'
  if (cfg.linkRequired && form.value.jump_type === 'product' && !form.value.jump_product_code) return error.value = '请填写产品5位编号'
  if (cfg.showVideoUploader && !form.value.video_url) return error.value = '请上传视频文件'
  saving.value = true
  error.value = ''
  try {
    const payload = { ...form.value }
    if (editing.value) {
      await updatePageModule(editing.value.id, payload)
    } else {
      await createPageModule(pageKey.value, payload)
    }
    showForm.value = false
    await loadBase()
  } catch (e) {
    error.value = e.message
  } finally {
    saving.value = false
  }
}

async function removeModule(item) {
  if (!window.confirm(`确认删除模块 #${item.module_no} 吗？将移入回收站。`)) return
  try {
    await deletePageModule(item.id)
    await loadBase()
    await loadRecycle()
  } catch (e) {
    alert(e.message)
  }
}

async function restoreRecycle(row) {
  try {
    await restoreModuleRecycle(row.id)
    await loadBase()
    await loadRecycle()
  } catch (e) {
    alert(e.message)
  }
}

async function purgeRecycle(row) {
  if (!window.confirm('确认永久清除该记录？该操作不可恢复。')) return
  try {
    await purgeModuleRecycle(row.id)
    await loadRecycle()
  } catch (e) {
    alert(e.message)
  }
}

function openPreview() {
  const path = pagePathMap[pageKey.value] || '/'
  window.open(`http://localhost:5173${path}`, '_blank')
}

function parseRule(rule = '') {
  const sizeMatch = rule.match(/(\d+)\s*[xX*]\s*(\d+)/)
  return {
    allowedTypes: ['image/png', 'image/jpeg', 'image/webp'],
    maxSize: 50 * 1024 * 1024,
    width: sizeMatch ? Number(sizeMatch[1]) : null,
    height: sizeMatch ? Number(sizeMatch[2]) : null,
  }
}

function validateImageFile(file) {
  const rule = parseRule(activeTemplateRule.value)
  if (!rule.allowedTypes.includes(file.type)) return '只允许 png/jpg/webp 图片'
  if (file.size > rule.maxSize) return `图片大小不能超过 ${Math.round(rule.maxSize / 1024)}KB`
  return null
}

function getImageSize(file) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.width, height: img.height })
    img.onerror = () => resolve({ width: 0, height: 0 })
    img.src = URL.createObjectURL(file)
  })
}

async function onImagesSelect(e) {
  const files = Array.from(e.target.files || [])
  const next = []
  const rule = parseRule(activeTemplateRule.value)
  for (const file of files) {
    const errMsg = validateImageFile(file)
    if (errMsg) {
      alert(`${file.name} 不合规：${errMsg}`)
      continue
    }
    if (rule.width && rule.height) {
      const size = await getImageSize(file)
      const ratioOk = Math.abs(size.width / size.height - rule.width / rule.height) < 0.15
      if (!ratioOk) {
        alert(`${file.name} 比例不符合要求，应接近 ${rule.width}:${rule.height}`)
        continue
      }
    }
    next.push({ name: file.name, url: file.name, size: file.size, type: file.type })
  }
  form.value.image_list_json = currentTemplateForm.value.imageMultiple
    ? [...(form.value.image_list_json || []), ...next]
    : (next[0] ? [next[0]] : [])
  e.target.value = ''
}

function removeImage(idx) {
  form.value.image_list_json.splice(idx, 1)
}

function addImageSlot() {
  form.value.image_list_json.push({ name: '', url: '' })
}

function onImageDragStart(idx) {
  imageDragIndex.value = idx
}

function onImageDrop(targetIdx) {
  const from = imageDragIndex.value
  if (from === null || from === targetIdx) return
  const rows = [...form.value.image_list_json]
  const [moving] = rows.splice(from, 1)
  rows.splice(targetIdx, 0, moving)
  form.value.image_list_json = rows
  imageDragIndex.value = null
}

async function onSingleImageSlotSelect(e, idx) {
  const files = Array.from(e.target.files || [])
  if (!files.length) return
  const file = files[0]
  const errMsg = validateImageFile(file)
  if (errMsg) {
    alert(`${file.name} 不合规：${errMsg}`)
    e.target.value = ''
    return
  }
  const rows = [...form.value.image_list_json]
  rows[idx] = { name: file.name, url: file.name, size: file.size, type: file.type }
  form.value.image_list_json = rows
  e.target.value = ''
}

function onVideoSelect(e) {
  const file = e.target.files?.[0]
  if (!file) return
  if (file.type !== 'video/mp4') {
    alert('仅支持 mp4 视频')
    e.target.value = ''
    return
  }
  if (file.size > 1024 * 1024 * 1024) {
    alert('视频大小不能超过1GB')
    e.target.value = ''
    return
  }
  form.value.video_url = file.name
  e.target.value = ''
}

function onDragStart(id, area) {
  dragState.value = { id, area }
}

function onTabDragStart(id) {
  tabDragId.value = id
}

async function onTabDrop(targetId) {
  if (!tabDragId.value || tabDragId.value === targetId) return
  const rows = [...pageTabs.value]
  const from = rows.findIndex((r) => r.id === tabDragId.value)
  const to = rows.findIndex((r) => r.id === targetId)
  if (from < 0 || to < 0) return
  const [moving] = rows.splice(from, 1)
  rows.splice(to, 0, moving)
  pageTabs.value = rows
  await Promise.all(rows.map((r, idx) => updateEditablePage(r.id, { tab_sort: idx })))
  tabDragId.value = null
}

function openPageDialog(item = null) {
  editingPage.value = item
  pageForm.value = item ? { title: item.title, nav_name: item.nav_name } : { title: '', nav_name: '' }
  showPageDialog.value = true
}

async function savePageDialog() {
  if (!pageForm.value.title || !pageForm.value.nav_name) return
  if (editingPage.value) {
    await updateEditablePage(editingPage.value.id, pageForm.value)
  } else {
    await createEditablePage({ ...pageForm.value, status: 1 })
  }
  showPageDialog.value = false
  await loadPages()
}

async function removePage(item) {
  if (!window.confirm(`确定删除页面「${item.title}」吗？`)) return
  await deleteEditablePage(item.id)
  if (activePage.value?.id === item.id) activePage.value = null
  await loadPages()
  if (pageTabs.value.length) await selectPage(pageTabs.value[0])
}

async function saveNavInfo() {
  if (!navForm.value.name) return alert('请填写导航名称')
  savingNav.value = true
  try {
    const payload = {
      parent_id: 0,
      name: navForm.value.name,
      en_name: navForm.value.en_name || null,
      page_id: activePage.value.id,
      link_url: navForm.value.link_url || null,
      target: navForm.value.target || '_self',
      status: Number(navForm.value.status) === 0 ? 0 : 1,
    }
    if (navForm.value.id) await updateNav(navForm.value.id, payload)
    else {
      const created = await createNav(payload)
      navForm.value.id = created.id
    }
    await loadNavByPage()
  } catch (e) {
    alert(e.message)
  } finally {
    savingNav.value = false
  }
}

async function searchJumpProduct() {
  if (!form.value.jump_product_code) return
  try {
    jumpProductPreview.value = await searchProductByCode(form.value.jump_product_code)
  } catch (e) {
    jumpProductPreview.value = null
    alert(e.message)
  }
}

async function onDrop(targetId, area) {
  const { id, area: fromArea } = dragState.value
  if (!id || fromArea !== area || id === targetId) return
  const list = area === 'modules' ? modules.value : recycleRows.value
  const fromIndex = list.findIndex((i) => i.id === id)
  const toIndex = list.findIndex((i) => i.id === targetId)
  if (fromIndex < 0 || toIndex < 0) return
  const [moving] = list.splice(fromIndex, 1)
  list.splice(toIndex, 0, moving)
  const orderIds = list.map((i) => i.id)
  try {
    if (area === 'modules') {
      await reorderPageModules(pageKey.value, { orderIds })
    } else {
      await reorderRecycleModules(pageKey.value, { orderIds })
    }
  } catch (e) {
    alert(e.message)
  }
  dragState.value = { id: null, area: null }
}

onMounted(async () => {
  await loadPages()
  if (pageTabs.value.length) {
    await selectPage(pageTabs.value[0])
  }
})
</script>

<style scoped>
.required { color: #dc2626; font-weight: 700; margin-right: 4px; }
.drag-handle { color: #2563eb; font-size: 12px; cursor: grab; }
.image-rule { color: #2563eb; }
.image-list { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
.image-chip { border: 1px solid #e5e7eb; border-radius: 6px; padding: 6px 8px; display: flex; align-items: center; gap: 6px; }
.image-chip a { color: #2563eb; text-decoration: underline; font-size: 12px; }
.card-item-editor { border: 1px dashed #cbd5e1; padding: 10px; border-radius: 8px; margin-bottom: 8px; display: grid; gap: 8px; }
.tabs-head { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.tabs-scroll { display: flex; gap: 8px; overflow-x: auto; flex: 1; }
.tab-btn { border: 1px solid #cbd5e1; background: #fff; color: #334155; border-radius: 8px; padding: 7px 12px; cursor: pointer; white-space: nowrap; }
.tab-btn.active { border-color: #2563eb; background: #eff6ff; color: #1d4ed8; }
.carousel-upload-list { display: grid; gap: 8px; }
.upload-slot { border: 1px dashed #cbd5e1; border-radius: 8px; padding: 8px; display: flex; align-items: center; gap: 8px; }
</style>
