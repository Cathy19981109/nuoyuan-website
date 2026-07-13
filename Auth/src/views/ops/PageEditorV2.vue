<template>
  <div>
    <div class="page-header">
      <div>
        <h2>页面编辑</h2>
        <p class="desc">按页面管理导航信息与页面内容，全部可视化操作</p>
      </div>
      <button class="btn btn-secondary" @click="openPageDialog()">新增页面</button>
    </div>

    <div class="card" style="margin-bottom: 16px">
      <div class="tabs-row">
        <button
          v-for="p in pages"
          :key="p.id"
          class="tab-btn"
          :class="{ active: activePage?.id === p.id }"
          draggable="true"
          @click="selectPage(p)"
          @dragstart="onPageDragStart(p.id)"
          @dragover.prevent
          @drop="onPageDrop(p.id)"
        >
          {{ p.title }}
        </button>
      </div>
    </div>

    <div v-if="activePage" class="card" style="margin-bottom: 16px">
      <div class="tabs-row">
        <button class="tab-btn" :class="{ active: activeTab === 'nav' }" @click="activeTab = 'nav'">导航信息</button>
        <button class="tab-btn" :class="{ active: activeTab === 'content' }" @click="activeTab = 'content'">导航内容</button>
      </div>

      <template v-if="activeTab === 'nav'">
        <div class="form-row" style="margin-top: 12px">
          <div class="form-group">
            <label><span class="required">*</span>导航名称</label>
            <input v-model="navForm.name" class="form-control" />
          </div>
          <div class="form-group">
            <label>英文名称</label>
            <input v-model="navForm.en_name" class="form-control" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>父级导航</label>
            <select v-model="navForm.parent_id" class="form-control">
              <option :value="0">顶级导航</option>
              <option v-for="n in navParents" :key="n.id" :value="n.id">{{ n.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>打开方式</label>
            <select v-model="navForm.target" class="form-control">
              <option value="_self">当前窗口</option>
              <option value="_blank">新窗口</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>自定义链接</label>
          <input v-model="navForm.link_url" class="form-control" />
        </div>
        <div class="form-group">
          <label>下拉横幅图</label>
          <input type="file" accept=".png,.jpg,.jpeg,.webp" @change="onNavBannerSelect" />
          <div class="hint" style="color:#1d4ed8">建议16:9，1920x720，png/jpg/webp，<=50MB</div>
          <div v-if="navForm.dropdown_banner" class="hint">已选择：{{ navForm.dropdown_banner }}</div>
        </div>
        <div class="save-bar-inline">
          <button class="btn btn-secondary" @click="openPageDialog(activePage)">编辑页面</button>
          <button class="btn btn-danger" @click="removePage(activePage)">删除页面</button>
          <button class="btn btn-primary" :disabled="savingNav" @click="saveNav">{{ savingNav ? '保存中...' : '保存导航信息' }}</button>
        </div>
      </template>
    </div>

    <template v-if="activePage && activeTab === 'content'">
      <div class="page-header">
        <div>
          <h2>{{ activePage.title }}内容</h2>
          <p class="desc">模块支持拖拽排序，删除后进入回收站30天</p>
        </div>
        <div class="toolbar">
          <button class="btn btn-secondary" @click="openPreview">前台预览</button>
          <button class="btn btn-primary" @click="openModuleDialog()">新增模块</button>
        </div>
      </div>

      <div class="card module-editor-grid">
        <div class="module-list-pane">
          <div v-if="!modules.length" class="empty-state">暂未添加模块</div>
          <div v-else class="module-card-list">
            <div
              v-for="m in modules"
              :key="m.id"
              class="module-card-item"
              :class="{ fixed: isFixedTopModule(m) }"
              :draggable="!isFixedTopModule(m)"
              @dragstart="onModuleDragStart(m.id)"
              @dragover.prevent
              @drop="onModuleDrop(m.id)"
            >
              <div class="module-thumb">
                <img v-if="firstImage(m)" :src="toPublicUrl(firstImage(m))" :alt="m.module_name" />
                <span v-else>{{ templateName(m.module_template) }}</span>
              </div>
              <div class="module-meta">
                <div class="module-name-line">
                  <strong>{{ m.module_name }}</strong>
                  <span v-if="isFixedTopModule(m)" class="badge">顶部固定</span>
                  <span v-if="isEditLockedModule(m)" class="badge">内容锁定</span>
                </div>
                <div class="hint">{{ templateName(m.module_template) }}</div>
                <div class="module-actions-inline">
                  <span class="drag-handle" :class="{ disabled: isFixedTopModule(m) }">{{ isFixedTopModule(m) ? '固定在顶部' : '⇅ 拖拽排序' }}</span>
                  <button class="btn btn-secondary btn-sm" :disabled="isEditLockedModule(m)" :class="{ 'btn-disabled': isEditLockedModule(m) }" @click="openModuleDialog(m)">编辑</button>
                  <button class="btn btn-danger btn-sm" :disabled="isDeleteLockedModule(m) || isFixedTopModule(m)" :class="{ 'btn-disabled': isDeleteLockedModule(m) || isFixedTopModule(m) }" @click="deleteModuleRow(m)">删除</button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="module-preview-pane">
          <h4>实时页面预览</h4>
          <div class="page-preview-canvas">
            <section v-for="m in modules" :key="`preview-${m.id}`" class="preview-block">
              <template v-if="m.extra_json?.system_key?.endsWith('_list_block')">
                <div class="preview-list-placeholder">{{ m.main_title || m.module_name }}</div>
              </template>
              <template v-else-if="m.module_template === 'full_width_single_image'">
                <img v-if="firstImage(m)" class="preview-image" :src="toPublicUrl(firstImage(m))" :alt="m.module_name" />
              </template>
              <template v-else-if="m.module_template === 'single_video_module'">
                <div class="preview-video">视频模块：{{ m.main_title || m.module_name }}</div>
              </template>
              <template v-else>
                <img v-if="firstImage(m)" class="preview-image" :src="toPublicUrl(firstImage(m))" :alt="m.module_name" />
                <h5>{{ m.main_title || m.module_name }}</h5>
                <p>{{ m.body_text || '暂无内容' }}</p>
              </template>
            </section>
          </div>
        </div>
      </div>
    </template>

    <div v-if="showModuleDialog" class="modal-overlay" @click.self="showModuleDialog = false">
      <div class="modal modal-lg">
        <div class="modal-header">
          <h3>{{ editingModule ? '编辑模块' : '新增模块' }}</h3>
          <button class="modal-close" @click="showModuleDialog = false">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group">
              <label><span class="required">*</span>模块名称</label>
              <input v-model="moduleForm.module_name" class="form-control" />
            </div>
            <div class="form-group">
              <label><span class="required">*</span>模板类型</label>
              <select v-model="moduleForm.module_template" class="form-control">
                <option v-for="t in templates" :key="t.code" :value="t.code">{{ t.name }}</option>
              </select>
            </div>
          </div>
          <div v-if="currentTemplate.code === 'image_text_split'" class="form-group">
            <label><span class="required">*</span>图文布局</label>
            <select v-model="moduleForm.layout_mode" class="form-control">
              <option value="overlay">图内叠加</option>
              <option value="top">图上</option>
              <option value="bottom">图下</option>
              <option value="left">图左</option>
              <option value="right">图右</option>
            </select>
          </div>

          <div v-if="showTitle" class="form-group">
            <label><span class="required">*</span>模块标题</label>
            <input v-model="moduleForm.main_title" class="form-control" />
          </div>
          <div v-if="showBody" class="form-group">
            <label><span class="required">*</span>正文内容</label>
            <textarea v-model="moduleForm.body_text" class="form-control" rows="4" />
          </div>

          <div v-if="showImage" class="form-group">
            <label><span class="required">*</span>素材上传</label>
            <div v-if="currentTemplate.code === 'multi_image_carousel'" class="slot-list">
              <div
                v-for="(img, idx) in moduleForm.image_list_json"
                :key="idx"
                class="slot-item"
                draggable="true"
                @dragstart="onImageDragStart(idx)"
                @dragover.prevent
                @drop="onImageDrop(idx)"
              >
                <input type="file" accept=".png,.jpg,.jpeg,.webp" @change="(e) => onCarouselFileSelect(e, idx)" />
                <span class="hint">{{ img.url ? `已上传：${extractFileName(img.url || img.name)}` : (img.name || `上传位${idx + 1}`) }}</span>
                <img v-if="img.url" class="slot-preview" :src="toPublicUrl(img.url)" :alt="img.name || `轮播图${idx + 1}`" />
                <button class="btn btn-danger btn-sm" @click="removeImage(idx)">删除</button>
              </div>
              <button class="btn btn-secondary btn-sm" @click="addImageSlot">+ 新增上传框</button>
            </div>
            <div v-else class="single-upload-box">
              <input type="file" accept=".png,.jpg,.jpeg,.webp" @change="onSingleImageSelect" />
              <div v-if="firstImage(moduleForm)" class="hint">已上传：{{ extractFileName(firstImage(moduleForm)) }}</div>
              <img v-if="firstImage(moduleForm)" class="single-preview" :src="toPublicUrl(firstImage(moduleForm))" :alt="moduleForm.module_name || '素材预览'" />
            </div>
          </div>

          <div v-if="currentTemplate.code === 'single_video_module'" class="form-group">
            <label><span class="required">*</span>视频文件</label>
            <input type="file" accept=".mp4" @change="onVideoSelect" />
            <div v-if="moduleForm.video_url" class="hint">已上传：{{ extractFileName(moduleForm.video_url) }}</div>
            <video v-if="moduleForm.video_url" class="video-preview" controls :src="toPublicUrl(moduleForm.video_url)" />
          </div>

          <div v-if="currentTemplate.code === 'image_jump_button'" class="form-group">
            <label><span class="required">*</span>跳转方式</label>
            <select v-model="moduleForm.jump_type" class="form-control">
              <option value="external">外部链接</option>
              <option value="product">绑定产品ID</option>
            </select>
          </div>
          <div v-if="currentTemplate.code === 'image_jump_button' && moduleForm.jump_type === 'external'" class="form-group">
            <label><span class="required">*</span>外部链接</label>
            <input v-model="moduleForm.link_url" class="form-control" />
          </div>
          <div v-if="currentTemplate.code === 'image_jump_button' && moduleForm.jump_type === 'product'" class="form-group">
            <label><span class="required">*</span>产品5位编号</label>
            <div class="toolbar">
              <input v-model="moduleForm.jump_product_code" class="form-control" style="max-width:220px" />
              <button class="btn btn-secondary btn-sm" @click="searchProduct">检索</button>
            </div>
            <div v-if="productPreview" class="hint">已匹配：{{ productPreview.name }}（{{ productPreview.product_code }}）</div>
          </div>

          <div class="alert" style="background:#eff6ff;color:#1e40af">
            素材规范：{{ templateRuleText }}
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showModuleDialog = false">取消</button>
          <button class="btn btn-primary" :disabled="savingModule" @click="saveModule">{{ savingModule ? '保存中...' : '保存模块' }}</button>
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
            <label><span class="required">*</span>页面名称</label>
            <input v-model="pageForm.title" class="form-control" />
          </div>
          <div class="form-group">
            <label><span class="required">*</span>页面英文标识</label>
            <input v-model="pageForm.nav_name" class="form-control" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showPageDialog = false">取消</button>
          <button class="btn btn-primary" @click="savePage">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import {
  getEditablePages, createEditablePage, updateEditablePage, deleteEditablePage,
  getNavList, createNav, updateNav, deleteNav,
  getPageTemplates, getPageModules, createPageModule, updatePageModule, deletePageModule, reorderPageModules,
  searchProductByCode, uploadImageFile, uploadVideoFile,
} from '@/api'
import { toPublicMediaUrl } from '@/utils/media'

const pages = ref([])
const activePage = ref(null)
const activeTab = ref('nav')
const pageDragId = ref(null)
const moduleDragId = ref(null)
const imageDragId = ref(null)

const navTree = ref([])
const navForm = ref({ id: null, parent_id: 0, name: '', en_name: '', link_url: '', target: '_self', dropdown_banner: '', status: 1 })
const savingNav = ref(false)

const templates = ref([])
const modules = ref([])
const showModuleDialog = ref(false)
const editingModule = ref(null)
const savingModule = ref(false)
const productPreview = ref(null)
const moduleForm = ref({
  module_name: '',
  module_template: '',
  main_title: '',
  body_text: '',
  layout_mode: 'top',
  image_list_json: [],
  video_url: '',
  jump_type: 'external',
  link_url: '',
  jump_product_code: '',
  status: 1,
})

const showPageDialog = ref(false)
const editingPage = ref(null)
const pageForm = ref({ title: '', nav_name: '' })
const DEFAULT_PAGES = [
  { title: '首页', nav_name: 'home', tab_sort: 1 },
  { title: '产品中心', nav_name: 'products', tab_sort: 2 },
  { title: '技术服务', nav_name: 'services', tab_sort: 3 },
  { title: '新闻动态', nav_name: 'news', tab_sort: 4 },
  { title: '关于我们', nav_name: 'about', tab_sort: 5 },
  { title: '联系我们', nav_name: 'contact', tab_sort: 6 },
]

const pageKey = computed(() => activePage.value?.nav_name || '')
const currentTemplate = computed(() => templates.value.find((t) => t.code === moduleForm.value.module_template) || {})
const showTitle = computed(() => ['image_text_split', 'single_video_module'].includes(currentTemplate.value.code))
const showBody = computed(() => ['image_text_split', 'single_video_module'].includes(currentTemplate.value.code))
const showImage = computed(() => ['full_width_single_image', 'image_text_split', 'multi_image_carousel', 'image_jump_button'].includes(currentTemplate.value.code))
const templateRuleText = computed(() => {
  if (currentTemplate.value.code === 'image_text_split') {
    const mode = moduleForm.value.layout_mode
    if (mode === 'top' || mode === 'bottom') return '图上/图下：16:9 1920x720，<=50MB'
    return '图左/图右/图内：4:3 1200x900，<=50MB'
  }
  return currentTemplate.value.imageRule || '请选择模板'
})
const navParents = computed(() => navTree.value.filter((n) => n.parent_id === 0 && n.page_id !== activePage.value?.id))

function templateName(code) {
  return templates.value.find((t) => t.code === code)?.name || code
}

function isLockedModule(row) {
  return !!(row?.extra_json && row.extra_json.system_lock)
}

function isFixedTopModule(row) {
  const key = row?.extra_json?.system_key
  return key === 'products_banner' || key === 'services_banner'
}

function isEditLockedModule(row) {
  return !!(row?.extra_json?.system_lock)
}

function isDeleteLockedModule(row) {
  return !!(row?.extra_json?.system_lock)
}

function normalizeFixedTopOrder(rows = []) {
  if (!Array.isArray(rows) || !rows.length) return []
  const fixed = rows.filter((row) => isFixedTopModule(row))
  const others = rows.filter((row) => !isFixedTopModule(row))
  return [...fixed, ...others]
}

async function ensureFixedTopOrder() {
  if (!['products', 'services'].includes(pageKey.value)) return
  const normalized = normalizeFixedTopOrder(modules.value || [])
  if (!normalized.length) return
  const unchanged = normalized.every((row, idx) => row.id === modules.value[idx]?.id)
  if (unchanged) return
  modules.value = normalized
  await reorderPageModules(pageKey.value, { orderIds: normalized.map((row) => row.id) })
}

function images(item) {
  return Array.isArray(item?.image_list_json) ? item.image_list_json : []
}

function firstImage(item) {
  const list = images(item)
  if (!list.length) return ''
  const first = list[0]
  return typeof first === 'string' ? first : (first.url || '')
}

function toPublicUrl(url) {
  return toPublicMediaUrl(url)
}

function extractFileName(url) {
  if (!url) return ''
  const clean = String(url).split('?')[0]
  const parts = clean.split('/')
  return parts[parts.length - 1] || clean
}

function flattenTree(nodes = [], out = []) {
  nodes.forEach((n) => {
    out.push(n)
    if (n.children?.length) flattenTree(n.children, out)
  })
  return out
}

async function loadPages() {
  let data = await getEditablePages({ pageSize: 200 })
  if (!(data.list || []).length) {
    for (const row of DEFAULT_PAGES) {
      await createEditablePage({ ...row, status: 1 })
    }
    data = await getEditablePages({ pageSize: 200 })
  }
  pages.value = (data.list || []).sort((a, b) => (a.tab_sort || 0) - (b.tab_sort || 0) || a.id - b.id)
  if (!activePage.value && pages.value.length) await selectPage(pages.value[0])
}

async function loadNav() {
  const tree = await getNavList()
  navTree.value = flattenTree(tree)
  const hit = navTree.value.find((n) => n.page_id === activePage.value?.id)
  navForm.value = hit
    ? { ...hit }
    : { id: null, parent_id: 0, name: activePage.value?.title || '', en_name: '', link_url: '', target: '_self', dropdown_banner: '', status: 1 }
}

async function loadModules() {
  templates.value = await getPageTemplates(pageKey.value)
  modules.value = await getPageModules(pageKey.value, { includeHidden: 1 })
  const presetMap = {
    home: [
      { module_name: '首页主横幅模块', module_template: 'full_width_single_image', image_list_json: [{ name: 'home-banner', url: '/uploads/images/demo-home-banner.jpg' }] },
      { module_name: '首页服务区模块', module_template: 'image_text_split', main_title: '基因编辑核心服务', body_text: '对应前台“基因编辑核心服务”内容区。', layout_mode: 'top', image_list_json: [{ name: 'home-service', url: '/uploads/images/demo-home-intro.jpg' }] },
      { module_name: '首页优势区模块', module_template: 'image_text_split', main_title: '核心优势', body_text: '对应前台“核心优势”内容区。', layout_mode: 'left', image_list_json: [{ name: 'home-advantage', url: '/uploads/images/demo-home-intro.jpg' }] },
      { module_name: '首页新闻区模块', module_template: 'image_text_split', main_title: '新闻动态', body_text: '对应前台“新闻动态”内容区。', layout_mode: 'right', image_list_json: [{ name: 'home-news', url: '/uploads/images/demo-home-intro.jpg' }] },
    ],
    products: [
      { module_name: '产品页Banner模块', module_template: 'image_text_split', main_title: '产品中心', body_text: '基因编辑核心服务 · 科研实验试剂产品', layout_mode: 'top', image_list_json: [{ name: 'products-banner', url: '/uploads/images/demo-products-1.jpg' }], extra_json: { system_key: 'products_banner' } },
      { module_name: '产品列表模块（系统）', module_template: 'image_text_split', main_title: '产品列表区', body_text: '该模块为系统固定展示区，仅用于占位提示，不可编辑/删除。', layout_mode: 'top', image_list_json: [{ name: 'products-list', url: '/uploads/images/demo-products-1.jpg' }], extra_json: { system_key: 'products_list_block', system_lock: true } },
    ],
    services: [
      { module_name: '服务页Banner模块', module_template: 'image_text_split', main_title: '技术服务', body_text: 'CRISPR/Cas9 全套技术服务 · 基因编辑一站式解决方案', layout_mode: 'top', image_list_json: [{ name: 'services-banner', url: '/uploads/images/demo-home-intro.jpg' }], extra_json: { system_key: 'services_banner' } },
      { module_name: '服务列表模块（系统）', module_template: 'image_text_split', main_title: '服务列表区', body_text: '该模块为系统固定展示区，仅用于占位提示，不可编辑/删除。', layout_mode: 'top', image_list_json: [{ name: 'services-list', url: '/uploads/images/demo-home-intro.jpg' }], extra_json: { system_key: 'services_list_block', system_lock: true } },
    ],
    news: [
      { module_name: '新闻页横幅模块', module_template: 'full_width_single_image', image_list_json: [{ name: 'news-banner', url: '/uploads/images/demo-news.jpg' }] },
      { module_name: '新闻列表补充模块', module_template: 'image_jump_button', jump_type: 'external', link_url: '/news', image_list_json: [{ name: 'news-card', url: '/uploads/images/demo-news.jpg' }] },
    ],
    about: [
      { module_name: '关于我们主内容模块', module_template: 'image_text_split', main_title: '公司简介', body_text: '对应前台关于我们主要内容。', layout_mode: 'top', image_list_json: [{ name: 'about', url: '/uploads/images/demo-about.jpg' }] },
    ],
    contact: [
      { module_name: '联系我们信息模块', module_template: 'image_text_split', main_title: '联系方式', body_text: '对应前台左侧联系方式区域。', layout_mode: 'left', image_list_json: [{ name: 'contact', url: '/uploads/images/demo-contact.jpg' }] },
      { module_name: '联系我们地图模块', module_template: 'image_text_split', main_title: '地图与导航', body_text: '对应前台右侧地图与导航区域。', layout_mode: 'right', image_list_json: [{ name: 'contact-map', url: '/uploads/images/demo-contact.jpg' }] },
    ],
  }
  const presets = presetMap[pageKey.value] || []
  // 产品/服务页面：保证系统固定模块存在（banner可编辑、列表锁定）
  if ((pageKey.value === 'products' || pageKey.value === 'services') && presets.length) {
    const existingKeys = new Set(
      (modules.value || [])
        .map((m) => m?.extra_json?.system_key)
        .filter(Boolean)
    )
    const required = presets.filter((row) => row.extra_json?.system_key).filter((row) => !existingKeys.has(row.extra_json.system_key))
    for (const row of required) {
      await createPageModule(pageKey.value, row)
    }
    if (required.length) {
      modules.value = await getPageModules(pageKey.value, { includeHidden: 1 })
    }
    await ensureFixedTopOrder()
    return
  }
  // 其他页面：仅在该页面完全没有模块时初始化
  if (!modules.value.length && presets.length) {
    for (const row of presets) {
      await createPageModule(pageKey.value, row)
    }
    modules.value = await getPageModules(pageKey.value, { includeHidden: 1 })
  }
  await ensureFixedTopOrder()
}

async function selectPage(page) {
  activePage.value = page
  activeTab.value = 'nav'
  await loadNav()
  await loadModules()
}

function openPageDialog(page = null) {
  editingPage.value = page
  pageForm.value = page ? { title: page.title, nav_name: page.nav_name } : { title: '', nav_name: '' }
  showPageDialog.value = true
}

async function savePage() {
  if (!pageForm.value.title || !pageForm.value.nav_name) return
  if (editingPage.value) await updateEditablePage(editingPage.value.id, pageForm.value)
  else await createEditablePage({ ...pageForm.value, status: 1 })
  showPageDialog.value = false
  await loadPages()
}

async function removePage(page) {
  if (!window.confirm(`确认删除页面「${page.title}」吗？`)) return
  await deleteEditablePage(page.id)
  const nav = navTree.value.find((n) => n.page_id === page.id)
  if (nav) await deleteNav(nav.id)
  activePage.value = null
  await loadPages()
}

function onPageDragStart(id) {
  pageDragId.value = id
}

async function onPageDrop(targetId) {
  if (!pageDragId.value || pageDragId.value === targetId) return
  const rows = [...pages.value]
  const from = rows.findIndex((r) => r.id === pageDragId.value)
  const to = rows.findIndex((r) => r.id === targetId)
  if (from < 0 || to < 0) return
  const [moving] = rows.splice(from, 1)
  rows.splice(to, 0, moving)
  pages.value = rows
  await Promise.all(rows.map((r, idx) => updateEditablePage(r.id, { tab_sort: idx })))
  pageDragId.value = null
}

async function saveNav() {
  if (!navForm.value.name) return
  savingNav.value = true
  try {
    const payload = {
      parent_id: navForm.value.parent_id || 0,
      name: navForm.value.name,
      en_name: navForm.value.en_name || null,
      page_id: activePage.value.id,
      link_url: navForm.value.link_url || null,
      target: navForm.value.target || '_self',
      dropdown_banner: navForm.value.dropdown_banner || null,
      status: Number(navForm.value.status) === 0 ? 0 : 1,
    }
    if (navForm.value.id) await updateNav(navForm.value.id, payload)
    else {
      const saved = await createNav(payload)
      navForm.value.id = saved.id
    }
    await loadNav()
  } finally {
    savingNav.value = false
  }
}

function parseImageRule() {
  return { allowed: ['image/png', 'image/jpeg', 'image/webp'], maxSize: 50 * 1024 * 1024, ratio: 16 / 9 }
}

function getImageSize(file) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.width, height: img.height })
    img.onerror = () => resolve({ width: 0, height: 0 })
    img.src = URL.createObjectURL(file)
  })
}

async function validateImage(file, ratio) {
  const rule = parseImageRule()
  if (!rule.allowed.includes(file.type)) return '只支持png/jpg/webp'
  if (file.size > rule.maxSize) return '图片不能超过50MB'
  const size = await getImageSize(file)
  if (size.width && size.height && Math.abs(size.width / size.height - ratio) > 0.2) return '图片比例不符合要求'
  return ''
}

async function onNavBannerSelect(e) {
  const file = e.target.files?.[0]
  if (!file) return
  const err = await validateImage(file, 16 / 9)
  if (err) return alert(err)
  const fd = new FormData()
  fd.append('file', file)
  const res = await uploadImageFile(fd)
  navForm.value.dropdown_banner = res.url
  e.target.value = ''
}

function openModuleDialog(item = null) {
  if (item && isEditLockedModule(item)) return
  editingModule.value = item
  productPreview.value = null
  moduleForm.value = item ? {
    ...item,
    image_list_json: Array.isArray(item.image_list_json) ? item.image_list_json : [],
    layout_mode: item.layout_mode || 'top',
    jump_type: item.jump_type || 'external',
    jump_product_code: item.jump_product_code || '',
    video_url: item.video_url || '',
  } : {
    module_name: '',
    module_template: templates.value[0]?.code || '',
    main_title: '',
    body_text: '',
    layout_mode: 'top',
    image_list_json: [],
    video_url: '',
    jump_type: 'external',
    link_url: '',
    jump_product_code: '',
    status: 1,
  }
  if (moduleForm.value.module_template === 'multi_image_carousel' && !moduleForm.value.image_list_json.length) {
    moduleForm.value.image_list_json = [{ name: '', url: '' }]
  }
  showModuleDialog.value = true
}

async function onSingleImageSelect(e) {
  const file = e.target.files?.[0]
  if (!file) return
  const ratio = currentTemplate.value.code === 'image_text_split' && ['overlay', 'left', 'right'].includes(moduleForm.value.layout_mode) ? 4 / 3 : 16 / 9
  const err = await validateImage(file, ratio)
  if (err) return alert(err)
  const fd = new FormData()
  fd.append('file', file)
  const res = await uploadImageFile(fd)
  moduleForm.value.image_list_json = [{ name: file.name, url: res.url }]
  e.target.value = ''
}

async function onCarouselFileSelect(e, idx) {
  const file = e.target.files?.[0]
  if (!file) return
  const err = await validateImage(file, 16 / 9)
  if (err) return alert(err)
  const fd = new FormData()
  fd.append('file', file)
  const res = await uploadImageFile(fd)
  const rows = [...moduleForm.value.image_list_json]
  rows[idx] = { name: file.name, url: res.url }
  moduleForm.value.image_list_json = rows
  e.target.value = ''
}

function addImageSlot() {
  moduleForm.value.image_list_json.push({ name: '', url: '' })
}

function removeImage(idx) {
  moduleForm.value.image_list_json.splice(idx, 1)
}

function onImageDragStart(idx) {
  imageDragId.value = idx
}

function onImageDrop(targetIdx) {
  const from = imageDragId.value
  if (from === null || from === targetIdx) return
  const rows = [...moduleForm.value.image_list_json]
  const [moving] = rows.splice(from, 1)
  rows.splice(targetIdx, 0, moving)
  moduleForm.value.image_list_json = rows
  imageDragId.value = null
}

function onVideoSelect(e) {
  const file = e.target.files?.[0]
  if (!file) return
  if (file.type !== 'video/mp4') return alert('仅支持mp4')
  if (file.size > 1024 * 1024 * 1024) return alert('视频不能超过1GB')
  const doUpload = async () => {
    const fd = new FormData()
    fd.append('file', file)
    const res = await uploadVideoFile(fd)
    moduleForm.value.video_url = res.url
    e.target.value = ''
  }
  doUpload().catch((err) => alert(err.message))
}

async function searchProduct() {
  if (!moduleForm.value.jump_product_code) return
  productPreview.value = await searchProductByCode(moduleForm.value.jump_product_code)
}

async function saveModule() {
  if (!moduleForm.value.module_name || !moduleForm.value.module_template) return
  if (showTitle.value && !moduleForm.value.main_title) return alert('请填写模块标题')
  if (showBody.value && !moduleForm.value.body_text) return alert('请填写正文内容')
  if (showImage.value && !moduleForm.value.image_list_json.length) return alert('请上传素材')
  if (currentTemplate.value.code === 'multi_image_carousel') {
    const invalid = moduleForm.value.image_list_json.some((x) => !x?.url)
    if (invalid) return alert('轮播图有空上传位，请上传或删除')
  }
  if (currentTemplate.value.code === 'single_video_module' && !moduleForm.value.video_url) return alert('请上传视频')
  if (currentTemplate.value.code === 'image_jump_button') {
    if (moduleForm.value.jump_type === 'external' && !moduleForm.value.link_url) return alert('请填写外部链接')
    if (moduleForm.value.jump_type === 'product' && !moduleForm.value.jump_product_code) return alert('请填写产品编号')
  }
  savingModule.value = true
  try {
    const payload = { ...moduleForm.value }
    if (editingModule.value) await updatePageModule(editingModule.value.id, payload)
    else await createPageModule(pageKey.value, payload)
    showModuleDialog.value = false
    await loadModules()
  } finally {
    savingModule.value = false
  }
}

async function deleteModuleRow(row) {
  if (isDeleteLockedModule(row) || isFixedTopModule(row)) return
  if (!window.confirm(`确认删除模块「${row.module_name}」吗？`)) return
  await deletePageModule(row.id)
  await loadModules()
}

function onModuleDragStart(id) {
  moduleDragId.value = id
}

async function onModuleDrop(targetId) {
  if (!moduleDragId.value || moduleDragId.value === targetId) return
  const rows = [...modules.value]
  const from = rows.findIndex((r) => r.id === moduleDragId.value)
  const to = rows.findIndex((r) => r.id === targetId)
  if (from < 0 || to < 0) return
  if (isFixedTopModule(rows[from]) || isFixedTopModule(rows[to])) {
    moduleDragId.value = null
    return
  }
  const [moving] = rows.splice(from, 1)
  rows.splice(to, 0, moving)
  const normalized = normalizeFixedTopOrder(rows)
  modules.value = normalized
  await reorderPageModules(pageKey.value, { orderIds: normalized.map((r) => r.id) })
  moduleDragId.value = null
}

function openPreview() {
  const map = {
    home: '/',
    products: '/products',
    services: '/services',
    news: '/news',
    about: '/about',
    contact: '/contact',
  }
  window.open(`http://localhost:5173${map[pageKey.value] || '/'}`, '_blank')
}

onMounted(async () => {
  await loadPages()
})
</script>

<style scoped>
.required { color: #dc2626; margin-right: 4px; font-weight: 700; }
.tabs-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.tab-btn { border: 1px solid #cbd5e1; background: #fff; color: #334155; border-radius: 8px; padding: 7px 12px; cursor: pointer; }
.tab-btn.active { border-color: #2563eb; background: #eff6ff; color: #1d4ed8; }
.drag-handle { color: #2563eb; font-size: 12px; cursor: grab; }
.slot-list { display: grid; gap: 8px; }
.slot-item { border: 1px dashed #cbd5e1; border-radius: 8px; padding: 8px; display: flex; align-items: center; gap: 8px; }
.slot-preview {
  width: 88px;
  height: 56px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}
.single-upload-box {
  display: grid;
  gap: 8px;
}
.single-preview {
  width: min(360px, 100%);
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}
.video-preview {
  width: min(420px, 100%);
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}
.btn-disabled {
  background: #e2e8f0 !important;
  border-color: #cbd5e1 !important;
  color: #94a3b8 !important;
  cursor: not-allowed !important;
}
.module-editor-grid {
  display: grid;
  grid-template-columns: minmax(420px, 1fr) minmax(420px, 1fr);
  gap: 16px;
}
.module-card-list {
  display: grid;
  gap: 10px;
}
.module-card-item {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 10px;
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 10px;
  background: #fff;
}
.module-card-item.fixed {
  border-color: #93c5fd;
  background: #eff6ff;
}
.module-thumb {
  height: 72px;
  border-radius: 8px;
  border: 1px dashed #cbd5e1;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  font-size: 12px;
}
.module-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.module-name-line {
  display: flex;
  align-items: center;
  gap: 6px;
}
.badge {
  font-size: 11px;
  color: #1d4ed8;
  background: #dbeafe;
  border-radius: 999px;
  padding: 1px 8px;
}
.module-actions-inline {
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.drag-handle.disabled {
  color: #94a3b8;
  cursor: not-allowed;
}
.module-preview-pane h4 {
  margin-bottom: 10px;
  color: #0f172a;
}
.page-preview-canvas {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 10px;
  background: #f8fafc;
  max-height: 640px;
  overflow: auto;
  display: grid;
  gap: 10px;
}
.preview-block {
  border: 1px solid #dbeafe;
  border-radius: 10px;
  padding: 10px;
  background: #fff;
}
.preview-image {
  width: 100%;
  border-radius: 8px;
  aspect-ratio: 16 / 5;
  object-fit: cover;
  margin-bottom: 8px;
}
.preview-video {
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  padding: 18px;
  text-align: center;
  color: #475569;
}
.preview-list-placeholder {
  border: 1px dashed #a7f3d0;
  background: #f0fdf4;
  color: #15803d;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
}
@media (max-width: 1200px) {
  .module-editor-grid {
    grid-template-columns: 1fr;
  }
}
</style>
