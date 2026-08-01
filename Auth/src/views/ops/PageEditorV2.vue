<template>
  <div>
    <div class="page-editor-sticky">
      <div class="page-header">
        <div>
          <h2>页面编辑</h2>
          <p class="desc">按页面管理导航内容模块，全部可视化操作</p>
        </div>
        <button class="btn btn-secondary" @click="openPageDialog()">新增页面</button>
      </div>

      <div class="card page-tabs-card">
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
    </div>

    <div v-if="activePage" class="page-header" style="margin-bottom: 16px">
      <div>
        <h2>导航内容</h2>
      </div>
      <div class="toolbar">
        <button class="btn btn-secondary" @click="openPreview">前台预览</button>
        <button class="btn btn-primary" @click="openModuleDialog()">新增模块</button>
      </div>
    </div>

    <template v-if="activePage">
      <div class="card module-editor-shell">
        <div v-if="!topLevelModules.length" class="empty-state">暂未添加模块</div>
        <div v-else class="module-visual-list">
          <template v-for="m in topLevelModules" :key="m.id">
            <!-- 子导航容器 -->
            <div
              v-if="m.module_template === 'sub_nav_group'"
              class="visual-group"
              draggable="true"
              @dragstart="onModuleDragStart(m.id, 0)"
              @dragover.prevent
              @drop="onModuleDrop(m.id, 0)"
            >
              <div class="visual-group-head">
                <div class="module-type-name">{{ moduleTypeLabel(m) }}</div>
                <div class="module-actions-inline">
                  <span class="drag-handle">⇅ 拖拽排序</span>
                  <button class="btn btn-secondary btn-sm" @click="openModuleDialog(m)">编辑</button>
                  <button class="btn btn-danger btn-sm" @click="deleteModuleRow(m)">删除</button>
                  <button
                    class="btn btn-primary btn-sm"
                    :disabled="!canAddChild(m)"
                    :class="{ 'btn-disabled': !canAddChild(m) }"
                    :title="canAddChild(m) ? '' : `子模块最多 ${SECTION_LIMIT} 个`"
                    @click="openModuleDialog(null, { parentId: m.id })"
                  >
                    添加子模块
                  </button>
                </div>
              </div>

              <div v-if="!childrenOf(m.id).length" class="visual-empty">暂无子模块，点击「添加子模块」开始编辑</div>
              <div v-else class="visual-group-body">
                <div
                  v-for="child in childrenOf(m.id)"
                  :key="child.id"
                  class="visual-card"
                  draggable="true"
                  @dragstart="onModuleDragStart(child.id, m.id)"
                  @dragover.prevent
                  @drop="onModuleDrop(child.id, m.id)"
                >
                  <div class="visual-card-toolbar">
                    <span class="module-style-name">{{ childTemplateLabel(child) }}</span>
                    <div class="module-actions-inline">
                      <span class="drag-handle">⇅ 拖拽排序</span>
                      <button class="btn btn-secondary btn-sm" @click="openModuleDialog(child)">编辑</button>
                      <button class="btn btn-danger btn-sm" @click="deleteModuleRow(child)">删除</button>
                    </div>
                  </div>
                  <div
                    class="preview-card preview-image-text"
                    :class="`layout-${normalizeNewsLayoutMode(child.layout_mode)}`"
                  >
                    <div class="preview-media">
                      <PreviewAutoCarousel
                        v-if="child.module_template === 'multi_image_carousel'"
                        :images="images(child)"
                        :interval-ms="3000"
                      />
                      <img
                        v-else-if="firstImage(child)"
                        class="preview-image"
                        :src="toPublicUrl(firstImage(child))"
                        :alt="child.module_name"
                      />
                      <div v-else class="preview-media-empty">暂无图片</div>
                    </div>
                    <div class="preview-text">
                      <h5>{{ child.main_title || child.module_name }}</h5>
                      <p>{{ child.body_text || '暂无正文' }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 普通顶级模块：预览样式 -->
            <div
              v-else
              class="visual-block"
              :class="{ fixed: isFixedTopModule(m) }"
              :draggable="!isFixedTopModule(m)"
              @dragstart="onModuleDragStart(m.id, 0)"
              @dragover.prevent
              @drop="onModuleDrop(m.id, 0)"
            >
              <div class="visual-group-head">
                <div class="module-type-name">{{ moduleTypeLabel(m) }}</div>
                <div class="module-actions-inline">
                  <span v-if="isFixedTopModule(m)" class="badge badge-fixed">固定</span>
                  <span v-else class="drag-handle">⇅</span>
                  <button class="btn btn-secondary btn-sm" :disabled="isEditLockedModule(m)" :class="{ 'btn-disabled': isEditLockedModule(m) }" @click="openModuleDialog(m)">编辑</button>
                  <button class="btn btn-danger btn-sm" :disabled="isDeleteLockedModule(m) || isFixedTopModule(m)" :class="{ 'btn-disabled': isDeleteLockedModule(m) || isFixedTopModule(m) }" @click="deleteModuleRow(m)">删除</button>
                </div>
              </div>
              <div class="preview-card preview-top-card" :class="{ fixed: isFixedTopModule(m) }">
                <template v-if="isContactInfoModule(m)">
                  <div class="contact-info-preview">
                    <h5>
                      {{ m.main_title || '联系方式' }}
                      <span class="badge badge-fixed">固定</span>
                    </h5>
                    <div class="contact-info-preview-grid">
                      <div class="contact-info-preview-text">
                        <p><span>公司名称</span>{{ contactInfoFromExtra(m.extra_json).company_name }}</p>
                        <p v-if="contactInfoFromExtra(m.extra_json).phone"><span>电话</span>{{ contactInfoFromExtra(m.extra_json).phone }}</p>
                        <p v-if="contactInfoFromExtra(m.extra_json).email"><span>邮箱</span>{{ contactInfoFromExtra(m.extra_json).email }}</p>
                        <p v-if="contactInfoFromExtra(m.extra_json).address"><span>地址</span>{{ contactInfoFromExtra(m.extra_json).address }}</p>
                      </div>
                    </div>
                  </div>
                </template>
                <template v-else-if="isListBlockModule(m)">
                  <div class="preview-list-placeholder">
                    <h5>
                      {{ m.main_title || m.module_name }}
                      <span class="badge badge-fixed">固定</span>
                    </h5>
                    <p>{{ m.body_text || '系统固定列表展示区（前台自动渲染产品/服务列表）' }}</p>
                  </div>
                </template>
                <template v-else-if="m.module_template === 'full_width_single_image'">
                  <div class="preview-card-inner preview-image-text layout-bottom">
                    <div class="preview-text">
                      <h5>
                        {{ m.main_title || (isBannerModule(m) ? '未设置前台标题' : moduleCustomTitle(m)) }}
                        <span v-if="isFixedTopModule(m)" class="badge badge-fixed">固定</span>
                      </h5>
                      <p v-if="m.extra_json?.subtitle_en" class="preview-sub-en">{{ m.extra_json.subtitle_en }}</p>
                      <p>{{ m.body_text || (isBannerModule(m) ? '未设置前台文案，请点击编辑填写' : '暂无内容') }}</p>
                    </div>
                    <div class="preview-media preview-media-wide">
                      <img v-if="firstImage(m)" class="preview-image" :src="toPublicUrl(firstImage(m))" :alt="m.module_name" />
                      <div v-else class="preview-media-empty">暂无图片</div>
                    </div>
                  </div>
                </template>
                <template v-else-if="m.module_template === 'multi_image_carousel'">
                  <div class="preview-media preview-media-wide">
                    <PreviewAutoCarousel :images="images(m)" :interval-ms="3000" />
                  </div>
                </template>
                <template v-else-if="m.module_template === 'single_video_module'">
                  <div class="preview-video">视频模块：{{ m.main_title || m.module_name }}</div>
                </template>
                <template v-else>
                  <div
                    class="preview-card-inner preview-image-text"
                    :class="`layout-${normalizeNewsLayoutMode(m.layout_mode)}`"
                  >
                    <div class="preview-media">
                      <img v-if="firstImage(m)" class="preview-image" :src="toPublicUrl(firstImage(m))" :alt="m.module_name" />
                      <div v-else class="preview-media-empty">{{ isEditLockedModule(m) ? '默认' : '暂无图片' }}</div>
                    </div>
                    <div class="preview-text">
                      <h5>
                        {{ moduleCustomTitle(m) }}
                        <span v-if="isFixedTopModule(m)" class="badge badge-fixed">固定</span>
                        <span v-if="isEditLockedModule(m)" class="badge">内容锁定</span>
                      </h5>
                      <p>{{ m.body_text || '暂无内容' }}</p>
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </template>
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
              <label><span class="required">*</span>{{ formNameLabel }}</label>
              <input
                v-if="formIsSystemOrBanner || isSubNavGroupForm"
                v-model="moduleForm.module_name"
                class="form-control"
                :placeholder="isSubNavGroupForm ? '子导航模块' : ''"
              />
              <input
                v-else
                v-model="moduleForm.main_title"
                class="form-control"
                placeholder="前台展示名称"
                @input="onCustomNameInput"
              />
            </div>
            <div v-if="!isChildForm && !isContactInfoForm" class="form-group">
              <label><span class="required">*</span>模板类型</label>
              <select
                v-model="moduleForm.module_template"
                class="form-control"
                :disabled="isSubNavGroupForm && !!editingModule"
              >
                <option v-for="t in availableTemplates" :key="t.code" :value="t.code">{{ t.name }}</option>
              </select>
            </div>
            <div v-else-if="isChildForm" class="form-group">
              <label>展示类型</label>
              <input class="form-control" :value="childAutoTypeHint" disabled />
            </div>
            <div v-else-if="isContactInfoForm" class="form-group">
              <label>模块类型</label>
              <input class="form-control" value="联系方式模块（固定）" disabled />
            </div>
          </div>
          <div v-if="showChildLayoutPicker || showNewsLayoutPicker" class="form-group">
            <label><span class="required">*</span>图文布局</label>
            <div class="layout-schemes" role="radiogroup" aria-label="图文布局">
              <button
                v-for="opt in newsLayoutOptions"
                :key="opt.value"
                type="button"
                class="layout-scheme"
                role="radio"
                :aria-checked="moduleForm.layout_mode === opt.value"
                :aria-label="opt.label"
                :class="{ active: moduleForm.layout_mode === opt.value }"
                @click="moduleForm.layout_mode = opt.value"
              >
                <span class="scheme-frame" :class="opt.schemeClass" aria-hidden="true">
                  <span class="scheme-text">
                    <i /><i /><i />
                  </span>
                  <span class="scheme-img" />
                </span>
              </button>
            </div>
          </div>
          <div v-else-if="currentTemplate.code === 'image_text_split'" class="form-group">
            <label><span class="required">*</span>图文布局</label>
            <select v-model="moduleForm.layout_mode" class="form-control">
              <option value="overlay">图内叠加</option>
              <option value="top">图上</option>
              <option value="bottom">图下</option>
              <option value="left">图左</option>
              <option value="right">图右</option>
            </select>
          </div>

          <div v-if="showTitle && formIsSystemOrBanner" class="form-group">
            <label><span class="required">*</span>{{ isContactInfoForm ? '板块标题' : (isBannerForm ? '前台标题' : '模块标题') }}</label>
            <input v-model="moduleForm.main_title" class="form-control" :placeholder="isBannerForm ? '前台 Banner 主标题' : ''" />
          </div>
          <div v-if="isBannerForm" class="form-group">
            <label>副标题（英文）</label>
            <input v-model="moduleForm.extra_json.subtitle_en" class="form-control" placeholder="如：NUOYUAN BIOTECH" />
          </div>
          <div v-if="showBody" class="form-group">
            <label><span class="required">*</span>{{ isBannerForm ? '前台文案' : '正文内容' }}</label>
            <textarea v-model="moduleForm.body_text" class="form-control" rows="4" :placeholder="isBannerForm ? '前台 Banner 说明文字' : ''" />
          </div>

          <template v-if="isContactInfoForm">
            <div class="form-group">
              <label>公司名称</label>
              <input v-model="moduleForm.extra_json.company_name" class="form-control" placeholder="诺元智合 NUOYUAN BIOTECH" />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>联系电话</label>
                <input v-model="moduleForm.extra_json.phone" class="form-control" />
              </div>
              <div class="form-group">
                <label>联系邮箱</label>
                <input v-model="moduleForm.extra_json.email" class="form-control" />
              </div>
            </div>
            <div class="form-group">
              <label>公司地址</label>
              <input v-model="moduleForm.extra_json.address" class="form-control" />
            </div>
          </template>

          <div v-if="showImage" class="form-group">
            <label><span class="required">*</span>素材上传</label>
            <div v-if="isChildForm || currentTemplate.code === 'multi_image_carousel'" class="slot-list">
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
              <div v-if="isChildForm" class="hint">上传 1 张为图文，2 张及以上自动轮播</div>
              <div v-else-if="isCarouselOnlyForm" class="hint">仅图片无文字；所有图片须统一 16:9 长方形，至少 2 张</div>
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
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  getEditablePages, createEditablePage, updateEditablePage, deleteEditablePage,
  getNavList, deleteNav,
  getPageTemplates, getPageModules, createPageModule, updatePageModule, deletePageModule, reorderPageModules,
  searchProductByCode, uploadImageFile, uploadVideoFile,
} from '@/api'
import { toPublicMediaUrl } from '@/utils/media'
import PreviewAutoCarousel from '@/components/PreviewAutoCarousel.vue'

const route = useRoute()
const router = useRouter()
const pages = ref([])
const activePage = ref(null)
const pageDragId = ref(null)
const moduleDragId = ref(null)
const imageDragId = ref(null)

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
  parent_id: 0,
  status: 1,
})
const dialogParentId = ref(0)
const moduleDragParentId = ref(0)

const showPageDialog = ref(false)
const editingPage = ref(null)
const pageForm = ref({ title: '', nav_name: '' })
const DEFAULT_PAGES = [
  { title: '首页', nav_name: 'home', tab_sort: 1 },
  { title: '产品中心', nav_name: 'products', tab_sort: 2 },
  { title: '技术服务', nav_name: 'services', tab_sort: 3 },
  { title: '应用领域', nav_name: 'applications', tab_sort: 4 },
  { title: '新闻动态', nav_name: 'news', tab_sort: 5 },
  { title: '关于我们', nav_name: 'about', tab_sort: 6 },
  { title: '联系我们', nav_name: 'contact', tab_sort: 7 },
]

const SYSTEM_BANNER_PAGES = ['home', 'products', 'services', 'applications', 'news', 'about']
/** 联系我们无 Banner，但仍需保证联系方式等系统模块 */
const SYSTEM_FIXED_PAGES = [...SYSTEM_BANNER_PAGES, 'contact']
/** 仅产品中心、技术服务保留系统列表占位模块 */
const SYSTEM_LIST_PAGES = ['products', 'services']

const pageKey = computed(() => activePage.value?.nav_name || '')
const SECTION_LIMIT = 5
const SECTION_PAGES = ['news', 'applications']
const currentTemplate = computed(() => templates.value.find((t) => t.code === moduleForm.value.module_template) || {})
const isChildForm = computed(() => Number(dialogParentId.value || moduleForm.value.parent_id || 0) > 0)
const isSubNavGroupForm = computed(() => moduleForm.value.module_template === 'sub_nav_group' && !isChildForm.value)
const formNameLabel = computed(() => {
  if (isContactInfoForm.value || isSubNavGroupForm.value || formIsSystemOrBanner.value) return '模块名称'
  return '自定义名称'
})
const availableTemplates = computed(() => {
  const list = Array.isArray(templates.value) ? [...templates.value] : []
  if (!list.some((t) => t.code === 'sub_nav_group')) {
    list.unshift({
      code: 'sub_nav_group',
      name: '子导航模块',
      imageRule: '容器模块：在内部添加子模块；子模块 1 张为图文，2 张及以上自动轮播',
    })
  }
  return list
})
const isCarouselOnlyForm = computed(() => currentTemplate.value.code === 'multi_image_carousel' && !isChildForm.value)
const isContactInfoForm = computed(() => isContactInfoModule(editingModule.value) || isContactInfoModule(moduleForm.value))
const isBannerForm = computed(() => isBannerModule(editingModule.value) || isBannerModule(moduleForm.value))

const showTitle = computed(() => {
  if (isSubNavGroupForm.value) return false
  if (isChildForm.value) return false
  if (isContactInfoForm.value) return true
  if (isBannerForm.value) return true
  if (currentTemplate.value.code === 'multi_image_carousel') return false
  return ['image_text_split', 'single_video_module'].includes(currentTemplate.value.code)
})
const showBody = computed(() => {
  if (isSubNavGroupForm.value) return false
  if (isContactInfoForm.value) return false
  if (isBannerForm.value) return true
  if (currentTemplate.value.code === 'multi_image_carousel') return false
  if (isChildForm.value) return true
  return ['image_text_split', 'single_video_module'].includes(currentTemplate.value.code)
})
const showImage = computed(() => {
  if (isSubNavGroupForm.value) return false
  if (isContactInfoForm.value) return false
  if (isChildForm.value) return true
  return ['full_width_single_image', 'image_text_split', 'multi_image_carousel', 'image_jump_button'].includes(currentTemplate.value.code)
})

const topLevelModules = computed(() =>
  (modules.value || []).filter((m) => Number(m.parent_id || 0) === 0)
)

function childrenOf(parentId) {
  const pid = Number(parentId)
  return (modules.value || [])
    .filter((m) => Number(m.parent_id || 0) === pid)
    .slice()
    .sort((a, b) => (a.sort || 0) - (b.sort || 0) || (a.module_no || 0) - (b.module_no || 0))
}

function canAddChild(parent) {
  if (!parent?.id) return false
  return childrenOf(parent.id).length < SECTION_LIMIT
}

function countValidImages(list) {
  return (Array.isArray(list) ? list : []).filter((item) => {
    if (!item) return false
    if (typeof item === 'string') return !!String(item).trim()
    return !!(item.url && String(item.url).trim())
  }).length
}

const childAutoTypeHint = computed(() => {
  const n = countValidImages(moduleForm.value.image_list_json)
  return n >= 2 ? '多图轮播（自动）' : '图文分栏（自动）'
})

/** 新闻/应用文章板块：左文右图 / 右文左图 / 上文下图 */
const newsLayoutOptions = [
  { value: 'right', label: '左文右图', schemeClass: 'scheme-text-left' },
  { value: 'left', label: '右文左图', schemeClass: 'scheme-text-right' },
  { value: 'bottom', label: '上文下图', schemeClass: 'scheme-text-top' },
]

function normalizeNewsLayoutMode(mode) {
  if (['left', 'right', 'bottom'].includes(mode)) return mode
  return 'bottom'
}

const templateRuleText = computed(() => {
  if (isContactInfoForm.value) return '联系方式为固定模块：紧跟 Banner，不可拖动/删除；可编辑标题与联系信息'
  if (isBannerForm.value) return 'Banner 为固定模块：可编辑前台标题、副标题、文案与背景图；不可拖动/删除'
  if (isSubNavGroupForm.value) return '容器模块：在内部添加子模块；子模块 1 张为图文，2 张及以上自动轮播'
  if (isChildForm.value) return '子模块：1 张图为图文，2 张及以上自动轮播；建议统一 16:9 长方形'
  if (currentTemplate.value.code === 'multi_image_carousel') {
    return '多图轮播：仅图片无文字；所有图片须为同一长方形尺寸（16:9，建议 1920×720），至少 2 张'
  }
  if (currentTemplate.value.code === 'image_text_split') {
    const mode = moduleForm.value.layout_mode
    if (mode === 'top' || mode === 'bottom') return '图上/图下：16:9 1920x720，<=50MB'
    return '图左/图右/图内：4:3 1200x900，<=50MB'
  }
  return currentTemplate.value.imageRule || '请选择模板'
})

const showChildLayoutPicker = computed(() => isChildForm.value)

const formIsSystemOrBanner = computed(() => {
  if (isContactInfoForm.value) return true
  if (editingModule.value && (isEditLockedModule(editingModule.value) || isFixedTopModule(editingModule.value))) {
    return true
  }
  const key = String(editingModule.value?.extra_json?.system_key || '')
  if (key.endsWith('_banner')) return true
  return moduleForm.value.module_template === 'full_width_single_image' && !isChildForm.value && !isSubNavGroupForm.value
})

const showNewsLayoutPicker = computed(() => {
  if (isChildForm.value) return false
  if (isContactInfoForm.value) return false
  if (isCarouselOnlyForm.value) return false
  if (!SECTION_PAGES.includes(pageKey.value)) return false
  if (formIsSystemOrBanner.value) return false
  return currentTemplate.value.code === 'image_text_split'
})

function templateName(code) {
  if (code === 'sub_nav_group') return '子导航模块'
  return templates.value.find((t) => t.code === code)?.name || code
}

function childTemplateLabel(row) {
  if (row?.module_template === 'multi_image_carousel') return '轮播'
  if (row?.module_template === 'image_text_split') return '图文'
  return templateName(row?.module_template)
}

/** 左上角模块名称（类型/系统名） */
function moduleTypeLabel(row) {
  if (!row) return '模块'
  const canonical = canonicalSystemModuleName(row)
  if (canonical) return canonical
  if (row.module_template === 'sub_nav_group') return '子导航模块'
  if (Number(row.parent_id || 0) > 0) return '子模块'
  return templateName(row.module_template) || '模块'
}

/** 加粗：用户自定义标题 */
function moduleCustomTitle(row) {
  if (!row) return '未命名'
  if (row.module_template === 'sub_nav_group') {
    return String(row.module_name || '').trim() || '子导航模块'
  }
  const custom = String(row.main_title || '').trim()
  if (custom) return custom
  return String(row.module_name || '').trim() || '未命名'
}

function isLockedModule(row) {
  return !!(row?.extra_json && row.extra_json.system_lock)
}

function isContactInfoModule(row) {
  return String(row?.extra_json?.system_key || '') === 'contact_info_block'
}

function isListBlockModule(row) {
  return String(row?.extra_json?.system_key || '').endsWith('_list_block')
}

function isFixedTopModule(row) {
  const key = String(row?.extra_json?.system_key || '')
  return key.endsWith('_banner') || key.endsWith('_list_block') || key === 'contact_info_block'
}

function isBannerModule(row) {
  if (!row) return false
  return String(row?.extra_json?.system_key || '').endsWith('_banner')
}

function isSystemOrBannerModule(row) {
  return isEditLockedModule(row) || isBannerModule(row) || isContactInfoModule(row) || isListBlockModule(row)
}

/** 系统 Banner / 列表占位 / 联系方式 统一命名 */
function canonicalSystemModuleName(row) {
  const key = String(row?.extra_json?.system_key || '')
  if (key.endsWith('_banner')) return 'Banner模块'
  if (key.endsWith('_list_block')) return '列表模块'
  if (key === 'contact_info_block') return '联系方式模块'
  return ''
}

function contactInfoFromExtra(extra = {}) {
  return {
    company_name: String(extra.company_name || '').trim() || '诺元智合 NUOYUAN BIOTECH',
    phone: String(extra.phone || '').trim(),
    email: String(extra.email || '').trim(),
    address: String(extra.address || '').trim(),
  }
}

/** 列表/删除确认等仍用可读名称 */
function moduleDisplayName(row) {
  if (!row) return '未命名模块'
  const title = moduleCustomTitle(row)
  const type = moduleTypeLabel(row)
  if (title && title !== type) return title
  return type || '未命名模块'
}

function onCustomNameInput() {
  const name = String(moduleForm.value.main_title || '').trim()
  if (name) moduleForm.value.module_name = name
}

function isEditLockedModule(row) {
  return !!(row?.extra_json?.system_lock)
}

function isDeleteLockedModule(row) {
  if (isContactInfoModule(row) || isListBlockModule(row)) return true
  return !!(row?.extra_json?.system_lock)
}

function normalizeFixedTopOrder(rows = []) {
  if (!Array.isArray(rows) || !rows.length) return []
  const banners = rows.filter((row) => isBannerModule(row))
  const contactInfo = rows.filter((row) => isContactInfoModule(row))
  const listBlocks = rows.filter((row) => isListBlockModule(row))
  const others = rows.filter((row) => !isBannerModule(row) && !isContactInfoModule(row) && !isListBlockModule(row))
  return [...banners, ...contactInfo, ...listBlocks, ...others]
}

async function ensureFixedTopOrder() {
  if (!SYSTEM_FIXED_PAGES.includes(pageKey.value)) return
  const top = topLevelModules.value || []
  const normalized = normalizeFixedTopOrder(top)
  if (!normalized.length) return
  const unchanged = normalized.every((row, idx) => row.id === top[idx]?.id)
  if (unchanged) return
  const orderIds = buildFullOrderAfterSiblingReorder(0, normalized.map((row) => row.id))
  await reorderPageModules(pageKey.value, { orderIds })
  modules.value = await getPageModules(pageKey.value, { includeHidden: 1 })
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
  const existingKeys = new Set((data.list || []).map((p) => p.nav_name).filter(Boolean))
  let created = false
  for (const row of DEFAULT_PAGES) {
    if (!existingKeys.has(row.nav_name)) {
      await createEditablePage({ ...row, status: 1 })
      created = true
    }
  }
  if (!(data.list || []).length || created) {
    data = await getEditablePages({ pageSize: 200 })
  }
  pages.value = (data.list || []).sort((a, b) => (a.tab_sort || 0) - (b.tab_sort || 0) || a.id - b.id)
  await applyRouteTarget()
}

async function loadModules() {
  templates.value = await getPageTemplates(pageKey.value)
  modules.value = await getPageModules(pageKey.value, { includeHidden: 1 })
  const presetMap = {
    home: [
      {
        module_name: 'Banner模块',
        module_template: 'full_width_single_image',
        main_title: '诺元智合',
        body_text: '专注基因编辑核心服务与科研实验试剂，为生命科学研究提供高品质解决方案',
        image_list_json: [{ name: 'home-banner', url: '/uploads/images/img-1785568646891-xal7uj.jpg' }],
        extra_json: { system_key: 'home_banner', subtitle_en: 'NUOYUAN BIOTECH' },
      },
      {
        module_name: '发现产品与服务',
        module_template: 'image_text_split',
        main_title: '发现产品与服务',
        body_text: '从基因编辑试剂到 CRISPR/Cas9 技术服务，按实验场景快速选型。支持目录号检索、规格对比，一键进入产品中心完成采购准备。',
        layout_mode: 'bottom',
        image_list_json: [{ name: 'home-discover', url: '/uploads/images/img-1785568646910-2bonui.jpg' }],
      },
      {
        module_name: '质控与交付保障',
        module_template: 'image_text_split',
        main_title: '质控与交付保障',
        body_text: '批次稳定、纯度可控、交付周期清晰。为高校、研究所与生物医药企业提供可复现的实验材料与全程技术跟进，降低试错成本。',
        layout_mode: 'bottom',
        image_list_json: [{ name: 'home-trust', url: '/uploads/images/img-1785570131480-vuijdt.jpg' }],
      },
      {
        module_name: '按应用场景选购',
        module_template: 'image_text_split',
        main_title: '按应用场景选购',
        body_text: '基础科研、药物研发、农业育种到临床转化，按领域查看推荐方案与配套试剂，缩短从课题到下单的决策路径。',
        layout_mode: 'bottom',
        image_list_json: [{ name: 'home-scene', url: '/uploads/images/img-1785570131496-z3wplp.jpg' }],
      },
      {
        module_name: '开启采购咨询',
        module_template: 'image_text_split',
        main_title: '准备好开始了吗？',
        body_text: '浏览产品目录获取规格参数，或通过联系我们提交实验需求，技术顾问将协助完成选型与报价。',
        layout_mode: 'bottom',
        image_list_json: [{ name: 'home-cta', url: '/uploads/images/img-1785570131532-0pl2sc.jpg' }],
      },
    ],
    products: [
      { module_name: 'Banner模块', module_template: 'image_text_split', main_title: '产品中心', body_text: '基因编辑核心服务 · 科研实验试剂产品', layout_mode: 'top', image_list_json: [{ name: 'products-banner', url: '/uploads/images/demo-products-1.jpg' }], extra_json: { system_key: 'products_banner' } },
      { module_name: '列表模块', module_template: 'image_text_split', main_title: '产品列表区', body_text: '该模块为系统固定展示区，仅用于占位提示，不可编辑/删除。', layout_mode: 'top', image_list_json: [{ name: 'products-list', url: '/uploads/images/demo-products-1.jpg' }], extra_json: { system_key: 'products_list_block', system_lock: true } },
    ],
    services: [
      { module_name: 'Banner模块', module_template: 'image_text_split', main_title: '技术服务', body_text: 'CRISPR/Cas9 全套技术服务 · 基因编辑一站式解决方案', layout_mode: 'top', image_list_json: [{ name: 'services-banner', url: '/uploads/images/demo-home-intro.jpg' }], extra_json: { system_key: 'services_banner' } },
      { module_name: '列表模块', module_template: 'image_text_split', main_title: '服务列表区', body_text: '该模块为系统固定展示区，仅用于占位提示，不可编辑/删除。', layout_mode: 'top', image_list_json: [{ name: 'services-list', url: '/uploads/images/demo-home-intro.jpg' }], extra_json: { system_key: 'services_list_block', system_lock: true } },
    ],
    applications: [
      {
        module_name: 'Banner模块',
        module_template: 'image_text_split',
        main_title: '应用领域',
        body_text: '基因编辑技术在各科研与产业领域的广泛应用',
        layout_mode: 'top',
        image_list_json: [{ name: 'applications-banner', url: '/uploads/images/img-1785568646891-xal7uj.jpg' }],
        extra_json: { system_key: 'applications_banner' },
      },
      {
        module_name: '子导航模块',
        module_template: 'sub_nav_group',
        main_title: '',
        body_text: '',
        parent_id: 0,
        _children: [
          {
            module_name: '基础科研',
            module_template: 'multi_image_carousel',
            main_title: '基础科研',
            body_text: '覆盖细胞系构建、基因敲除与功能验证，助力高校与研究所快速推进课题。',
            layout_mode: 'right',
            image_list_json: [
              { name: 'app-basic-1', url: '/uploads/images/img-1785568646910-2bonui.jpg' },
              { name: 'app-basic-2', url: '/uploads/images/img-1785568646929-0ttyln.jpg' },
              { name: 'app-basic-3', url: '/uploads/images/img-1785568646947-pza92g.jpg' },
            ],
          },
          {
            module_name: '药物研发',
            module_template: 'image_text_split',
            main_title: '药物研发',
            body_text: '为靶点验证、细胞模型与药效评估提供稳定试剂与技术支持，缩短研发周期。',
            layout_mode: 'left',
            image_list_json: [{ name: 'app-pharma', url: '/uploads/images/img-1785570131480-vuijdt.jpg' }],
          },
          {
            module_name: '农业育种',
            module_template: 'multi_image_carousel',
            main_title: '农业育种',
            body_text: '面向作物性状改良与抗逆育种，提供高效基因编辑工具与检测方案。',
            layout_mode: 'bottom',
            image_list_json: [
              { name: 'app-agri-1', url: '/uploads/images/img-1785570131496-z3wplp.jpg' },
              { name: 'app-agri-2', url: '/uploads/images/img-1785570131514-1wumnp.jpg' },
              { name: 'app-agri-3', url: '/uploads/images/img-1785570131532-0pl2sc.jpg' },
            ],
          },
          {
            module_name: '临床转化',
            module_template: 'image_text_split',
            main_title: '临床转化',
            body_text: '从实验室到转化研究，提供合规质控与可复现的技术路径支持。',
            layout_mode: 'right',
            image_list_json: [{ name: 'app-clinic', url: '/uploads/images/img-1785568646891-xal7uj.jpg' }],
          },
          {
            module_name: '工业生物',
            module_template: 'image_text_split',
            main_title: '工业生物',
            body_text: '服务酶工程、菌株改造与代谢通路优化，提升工艺稳定性与产量表现。',
            layout_mode: 'left',
            image_list_json: [{ name: 'app-industry', url: '/uploads/images/img-1785568646910-2bonui.jpg' }],
          },
        ],
      },
    ],
    news: [
      {
        module_name: 'Banner模块',
        module_template: 'image_text_split',
        main_title: '新闻动态',
        body_text: '了解最新行业资讯与公司动态，掌握基因编辑与生命科学前沿进展。',
        layout_mode: 'top',
        image_list_json: [{ name: 'news-banner', url: '/uploads/images/img-1785568646891-xal7uj.jpg' }],
        extra_json: { system_key: 'news_banner' },
      },
      {
        module_name: '子导航模块',
        module_template: 'sub_nav_group',
        main_title: '',
        body_text: '',
        parent_id: 0,
        _children: [
          {
            module_name: '行业前沿',
            module_template: 'multi_image_carousel',
            main_title: '行业前沿',
            body_text: '聚焦基因编辑、合成生物学与转化医学热点，持续更新研究动态。',
            layout_mode: 'bottom',
            image_list_json: [
              { name: 'news-carousel-1', url: '/uploads/images/img-1785568646910-2bonui.jpg' },
              { name: 'news-carousel-2', url: '/uploads/images/img-1785568646929-0ttyln.jpg' },
              { name: 'news-carousel-3', url: '/uploads/images/img-1785568646947-pza92g.jpg' },
            ],
          },
          {
            module_name: '公司动态',
            module_template: 'multi_image_carousel',
            main_title: '公司动态',
            body_text: '展示诺元智合产品发布、技术合作与服务升级相关资讯。',
            layout_mode: 'bottom',
            image_list_json: [
              { name: 'news-company-1', url: '/uploads/images/img-1785570131480-vuijdt.jpg' },
              { name: 'news-company-2', url: '/uploads/images/img-1785570131496-z3wplp.jpg' },
              { name: 'news-company-3', url: '/uploads/images/img-1785570131514-1wumnp.jpg' },
            ],
          },
          {
            module_name: '专题解读',
            module_template: 'image_text_split',
            main_title: '专题解读',
            body_text: '围绕 CRISPR、RNA 合成与载体构建等主题，提供可落地的技术解读与应用案例。',
            layout_mode: 'right',
            image_list_json: [{ name: 'news-feature', url: '/uploads/images/img-1785570131532-0pl2sc.jpg' }],
          },
        ],
      },
    ],
    about: [
      {
        module_name: 'Banner模块',
        module_template: 'image_text_split',
        main_title: '关于我们',
        body_text: '诺元智合 · 专注基因编辑与生命科学研究',
        layout_mode: 'top',
        image_list_json: [{ name: 'about-banner', url: '/uploads/images/img-1785568646891-xal7uj.jpg' }],
        extra_json: { system_key: 'about_banner' },
      },
      {
        module_name: '公司简介',
        module_template: 'image_text_split',
        main_title: '公司简介',
        body_text: '诺元智合（NUOYUAN BIOTECH）是一家专注于基因编辑核心服务与科研实验试剂的高新技术企业。我们致力于为生命科学研究机构、生物医药企业提供高品质的 RNA 合成、CRISPR/Cas9 技术服务、基因载体构建及分子生物学、细胞培养等科研试剂产品。',
        layout_mode: 'right',
        image_list_json: [{ name: 'about-intro', url: '/uploads/images/img-1785568646910-2bonui.jpg' }],
      },
      {
        module_name: '我们的使命',
        module_template: 'image_text_split',
        main_title: '我们的使命',
        body_text: '以技术创新驱动生命科学进步，为科研工作者提供可靠、高效的产品与服务。坚持批次稳定、纯度可控与全程技术跟进，帮助高校、研究所与生物医药企业缩短从课题到落地的路径。',
        layout_mode: 'left',
        image_list_json: [{ name: 'about-mission', url: '/uploads/images/img-1785568646929-0ttyln.jpg' }],
      },
      {
        module_name: '核心优势',
        module_template: 'image_text_split',
        main_title: '核心优势',
        body_text: '超长链 RNA 合成最高可达 266nt；CRISPR/Cas9 全套技术服务，编辑效率高、脱靶可控；严格质控体系，批次稳定；全程技术跟进，交付周期短，助力科研与产业落地。',
        layout_mode: 'bottom',
        image_list_json: [
          { name: 'about-adv', url: '/uploads/images/img-1785568646947-pza92g.jpg' },
        ],
      },
      {
        module_name: '研发与质控',
        module_template: 'multi_image_carousel',
        main_title: '研发与质控',
        body_text: '',
        layout_mode: 'bottom',
        image_list_json: [
          { name: 'about-rd-1', url: '/uploads/images/img-1785570131480-vuijdt.jpg' },
          { name: 'about-rd-2', url: '/uploads/images/img-1785570131496-z3wplp.jpg' },
          { name: 'about-rd-3', url: '/uploads/images/img-1785570131514-1wumnp.jpg' },
        ],
      },
      {
        module_name: '商务合作',
        module_template: 'image_text_split',
        main_title: '商务合作',
        body_text: '无论是产品采购、技术服务委托，还是长期战略合作，我们都欢迎与您沟通。请通过电话、邮箱或到访与我们联系，技术顾问将协助完成选型与方案确认。',
        layout_mode: 'right',
        image_list_json: [{ name: 'contact-biz', url: '/uploads/images/img-1785570131532-0pl2sc.jpg' }],
      },
      {
        module_name: '服务支持',
        module_template: 'image_text_split',
        main_title: '服务支持',
        body_text: '从实验方案咨询、产品规格对比到售后技术跟进，诺元智合提供一站式支持。工作日我们将尽快回复您的需求，并安排专人跟进项目进度。',
        layout_mode: 'left',
        image_list_json: [{ name: 'contact-support', url: '/uploads/images/img-1785568646910-2bonui.jpg' }],
      },
      {
        module_name: '到访接待',
        module_template: 'image_text_split',
        main_title: '到访与接待',
        body_text: '欢迎预约到访交流。实验室与办公环境支持样品核对、方案讨论与技术培训。请提前通过电话或邮箱预约，我们将为您安排接待与路线指引。',
        layout_mode: 'bottom',
        image_list_json: [{ name: 'contact-visit', url: '/uploads/images/img-1785568646929-0ttyln.jpg' }],
      },
      {
        module_name: '办公环境',
        module_template: 'multi_image_carousel',
        main_title: '办公与实验室环境',
        body_text: '',
        layout_mode: 'bottom',
        image_list_json: [
          { name: 'contact-env-1', url: '/uploads/images/img-1785568646947-pza92g.jpg' },
          { name: 'contact-env-2', url: '/uploads/images/img-1785570131480-vuijdt.jpg' },
          { name: 'contact-env-3', url: '/uploads/images/img-1785570131496-z3wplp.jpg' },
        ],
      },
    ],
    contact: [
      {
        module_name: '联系方式模块',
        module_template: 'image_text_split',
        main_title: '联系方式',
        body_text: '',
        layout_mode: 'top',
        image_list_json: [],
        extra_json: {
          system_key: 'contact_info_block',
          company_name: '诺元智合 NUOYUAN BIOTECH',
          phone: '',
          email: '',
          address: '',
        },
      },
    ],
  }
  const presets = presetMap[pageKey.value] || []
  // 保证系统固定模块存在：Banner 各页可编辑；列表占位仅产品/服务；联系我们仅联系方式
  if (SYSTEM_FIXED_PAGES.includes(pageKey.value) && presets.length) {
    if (SYSTEM_BANNER_PAGES.includes(pageKey.value)) {
      await ensureUniqueSystemBanner()
    }
    await removeContactBannerIfAny()
    const existingKeys = new Set(
      (modules.value || [])
        .map((m) => m?.extra_json?.system_key)
        .filter(Boolean)
    )
    const required = presets
      .filter((row) => row.extra_json?.system_key)
      .filter((row) => {
        const key = row.extra_json.system_key
        if (String(key).endsWith('_banner')) {
          if (!SYSTEM_BANNER_PAGES.includes(pageKey.value)) return false
          return !existingKeys.has(key)
        }
        if (String(key).endsWith('_list_block') && !SYSTEM_LIST_PAGES.includes(pageKey.value)) return false
        return !existingKeys.has(key)
      })
    for (const row of required) {
      await createPageModule(pageKey.value, row)
    }
    // 首页 / 新闻 / 应用 / 关于我们 / 联系我们：尚无内容板块时补齐演示模块
    const DEMO_CONTENT_PAGES = ['home', 'about', ...SECTION_PAGES]
    if (DEMO_CONTENT_PAGES.includes(pageKey.value)) {
      const contentModules = (modules.value || []).filter((m) => !m?.extra_json?.system_key)
      if (!contentModules.length) {
        const demoRows = presets.filter((row) => !row.extra_json?.system_key)
        for (const row of demoRows) {
          const { _children, ...parentPayload } = row
          const created = await createPageModule(pageKey.value, parentPayload)
          if (row.module_template === 'sub_nav_group' && Array.isArray(_children) && created?.id) {
            for (const child of _children) {
              await createPageModule(pageKey.value, { ...child, parent_id: created.id })
            }
          }
        }
        if (demoRows.length) required.push(...demoRows)
      }
    }
    if (required.length) {
      modules.value = await getPageModules(pageKey.value, { includeHidden: 1 })
    }
    if (SYSTEM_BANNER_PAGES.includes(pageKey.value)) {
      await ensureUniqueSystemBanner()
    }
    await removeContactBannerIfAny()
    await normalizeSystemModuleNames()
    await migrateSectionModulesToSubNav()
    await ensureFixedTopOrder()
    return
  }
  // 其他页面：仅在该页面完全没有模块时初始化
  if (!modules.value.length && presets.length) {
    for (const row of presets) {
      const { _children, ...parentPayload } = row
      const created = await createPageModule(pageKey.value, parentPayload)
      if (row.module_template === 'sub_nav_group' && Array.isArray(_children) && created?.id) {
        for (const child of _children) {
          await createPageModule(pageKey.value, { ...child, parent_id: created.id })
        }
      }
    }
    modules.value = await getPageModules(pageKey.value, { includeHidden: 1 })
  }
  await normalizeSystemModuleNames()
  await migrateSectionModulesToSubNav()
  await ensureFixedTopOrder()
}

/** 新闻/应用：将历史扁平内容模块迁入子导航容器 */
async function migrateSectionModulesToSubNav() {
  if (!SECTION_PAGES.includes(pageKey.value)) return
  const rows = modules.value || []
  const hasSubNav = rows.some((m) => m.module_template === 'sub_nav_group' && Number(m.parent_id || 0) === 0)
  if (hasSubNav) return
  const orphans = rows.filter((m) => {
    if (Number(m.parent_id || 0) > 0) return false
    if (m?.extra_json?.system_key) return false
    if (m.module_template === 'sub_nav_group') return false
    return true
  })
  if (!orphans.length) return
  const parent = await createPageModule(pageKey.value, {
    module_name: '子导航模块',
    module_template: 'sub_nav_group',
    parent_id: 0,
    status: 1,
  })
  if (!parent?.id) return
  for (const row of orphans) {
    await updatePageModule(row.id, { parent_id: parent.id })
  }
  modules.value = await getPageModules(pageKey.value, { includeHidden: 1 })
}

/** 历史数据去掉页面前缀，统一为 Banner模块 / 列表模块 */
async function normalizeSystemModuleNames() {
  const rows = modules.value || []
  let changed = false
  for (const row of rows) {
    const next = canonicalSystemModuleName(row)
    if (!next || row.module_name === next) continue
    await updatePageModule(row.id, { module_name: next })
    row.module_name = next
    changed = true
  }
  if (changed) {
    modules.value = [...rows]
  }
}

/** 联系我们页不再使用 Banner：清理历史 contact_banner */
async function removeContactBannerIfAny() {
  if (pageKey.value !== 'contact') return
  const banners = (modules.value || []).filter((m) => {
    return String(m?.extra_json?.system_key || '') === 'contact_banner'
  })
  if (!banners.length) return
  for (const row of banners) {
    await deletePageModule(row.id)
  }
  modules.value = await getPageModules('contact', { includeHidden: 1 })
}

/** 每个页面只保留一个系统 Banner；首页合并历史「主横幅」重复项 */
async function ensureUniqueSystemBanner() {
  const key = pageKey.value
  if (!SYSTEM_BANNER_PAGES.includes(key)) return
  const bannerKey = `${key}_banner`
  const rows = modules.value || []

  const bySystemKey = rows.filter((m) => m?.extra_json?.system_key === bannerKey)
  const legacyHome = key === 'home'
    ? rows.filter((m) => {
      if (m?.extra_json?.system_key === bannerKey) return false
      if (m?.module_template === 'full_width_single_image') return true
      const name = String(m?.module_name || '')
      return /主横幅|Banner模块|^banner$/i.test(name)
    })
    : []

  const seen = new Set()
  const candidates = [...bySystemKey, ...legacyHome].filter((m) => {
    if (!m?.id || seen.has(m.id)) return false
    seen.add(m.id)
    return true
  })

  if (!candidates.length) return

  const [keep, ...dupes] = candidates
  const nextExtra = { ...(keep.extra_json || {}), system_key: bannerKey }
  if (key === 'home' && !String(nextExtra.subtitle_en || '').trim()) {
    nextExtra.subtitle_en = 'NUOYUAN BIOTECH'
  }
  const nextTitle = String(keep.main_title || '').trim()
    || (key === 'home' ? '诺元智合' : '')
  const nextBody = String(keep.body_text || '').trim()
    || (key === 'home'
      ? '专注基因编辑核心服务与科研实验试剂，为生命科学研究提供高品质解决方案'
      : '')
  const needUpdate =
    keep.extra_json?.system_key !== bannerKey
    || keep.module_name !== 'Banner模块'
    || (key === 'home' && (!String(keep.main_title || '').trim() || !String(keep.body_text || '').trim() || !String(keep.extra_json?.subtitle_en || '').trim()))

  if (needUpdate) {
    await updatePageModule(keep.id, {
      module_name: 'Banner模块',
      module_template: keep.module_template || 'full_width_single_image',
      image_list_json: keep.image_list_json,
      main_title: nextTitle || keep.main_title,
      body_text: nextBody || keep.body_text,
      layout_mode: keep.layout_mode,
      extra_json: nextExtra,
      status: keep.status ?? 1,
    })
  }

  for (const row of dupes) {
    await deletePageModule(row.id)
  }

  if (needUpdate || dupes.length) {
    modules.value = await getPageModules(key, { includeHidden: 1 })
  }
}

async function selectPage(page) {
  if (!page) return
  activePage.value = page
  await loadModules()
  const nextQuery = {
    pageId: String(page.id),
    ...(page.nav_name ? { pageKey: page.nav_name } : {}),
    ...(page.title ? { name: page.title } : {}),
  }
  const same =
    String(route.query.pageId || '') === nextQuery.pageId
    && String(route.query.pageKey || '') === String(nextQuery.pageKey || '')
    && String(route.query.name || '') === String(nextQuery.name || '')
  if (!same) {
    router.replace({ name: 'PageEditor', query: nextQuery })
  }
}

function findPageByRouteQuery() {
  const pageId = Number(route.query.pageId || 0)
  const pageKey = String(route.query.pageKey || '').trim()
  const name = String(route.query.name || '').trim()
  if (pageId) {
    const byId = pages.value.find((p) => Number(p.id) === pageId)
    if (byId) return byId
  }
  if (pageKey) {
    const byKey = pages.value.find((p) => p.nav_name === pageKey)
    if (byKey) return byKey
  }
  if (name) {
    const byName = pages.value.find((p) => p.title === name || p.nav_name === name)
    if (byName) return byName
  }
  return null
}

async function applyRouteTarget() {
  const target = findPageByRouteQuery()
  if (target) {
    if (activePage.value?.id !== target.id) await selectPage(target)
    return
  }
  if (!activePage.value && pages.value.length) await selectPage(pages.value[0])
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
  try {
    const tree = await getNavList()
    const flat = flattenTree(tree)
    const nav = flat.find((n) => n.page_id === page.id)
    if (nav) await deleteNav(nav.id)
  } catch {
    // ignore nav cleanup failures
  }
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

async function validateImage(file, ratio, options = {}) {
  const rule = parseImageRule()
  const tolerance = options.tolerance ?? 0.2
  const ratioLabel = options.ratioLabel || `${ratio}`
  if (!rule.allowed.includes(file.type)) return '只支持png/jpg/webp'
  if (file.size > rule.maxSize) return '图片不能超过50MB'
  const size = await getImageSize(file)
  if (size.width && size.height && Math.abs(size.width / size.height - ratio) > tolerance) {
    return `图片须为统一长方形比例（${ratioLabel}，建议 1920×720）`
  }
  return ''
}

function openModuleDialog(item = null, options = {}) {
  if (item && isEditLockedModule(item)) return
  const parentId = item
    ? Number(item.parent_id || 0)
    : Number(options.parentId || 0)
  if (!item && parentId > 0) {
    const parent = (modules.value || []).find((m) => Number(m.id) === parentId)
    if (parent && !canAddChild(parent)) {
      alert(`子模块最多 ${SECTION_LIMIT} 个`)
      return
    }
  }
  dialogParentId.value = parentId
  editingModule.value = item
  productPreview.value = null
  if (item) {
    const extra = item.extra_json && typeof item.extra_json === 'object' ? { ...item.extra_json } : {}
    if (isContactInfoModule(item)) {
      Object.assign(extra, contactInfoFromExtra(extra), { system_key: 'contact_info_block' })
    }
    if (isBannerModule(item)) {
      extra.subtitle_en = String(extra.subtitle_en || '').trim()
    }
    moduleForm.value = {
      ...item,
      image_list_json: Array.isArray(item.image_list_json) ? [...item.image_list_json] : [],
      layout_mode: item.layout_mode || 'top',
      jump_type: item.jump_type || 'external',
      jump_product_code: item.jump_product_code || '',
      video_url: item.video_url || '',
      parent_id: Number(item.parent_id || 0),
      extra_json: extra,
    }
    if (isBannerModule(item) && pageKey.value === 'home') {
      if (!String(moduleForm.value.main_title || '').trim()) moduleForm.value.main_title = '诺元智合'
      if (!String(moduleForm.value.body_text || '').trim()) {
        moduleForm.value.body_text = '专注基因编辑核心服务与科研实验试剂，为生命科学研究提供高品质解决方案'
      }
      if (!String(moduleForm.value.extra_json?.subtitle_en || '').trim()) {
        moduleForm.value.extra_json.subtitle_en = 'NUOYUAN BIOTECH'
      }
    }
  } else if (parentId > 0) {
    moduleForm.value = {
      module_name: '',
      module_template: 'image_text_split',
      main_title: '',
      body_text: '',
      layout_mode: 'bottom',
      image_list_json: [{ name: '', url: '' }],
      video_url: '',
      jump_type: 'external',
      link_url: '',
      jump_product_code: '',
      parent_id: parentId,
      status: 1,
    }
  } else {
    const defaultTpl = (templates.value.find((t) => t.code === 'image_text_split')
      || templates.value.find((t) => t.code !== 'sub_nav_group')
      || templates.value[0])?.code || ''
    moduleForm.value = {
      module_name: '',
      module_template: defaultTpl,
      main_title: '',
      body_text: '',
      layout_mode: 'top',
      image_list_json: [],
      video_url: '',
      jump_type: 'external',
      link_url: '',
      jump_product_code: '',
      parent_id: 0,
      status: 1,
    }
  }
  // 系统 Banner/列表：编辑框展示统一名称
  if (item) {
    const canonical = canonicalSystemModuleName(item)
    if (canonical) moduleForm.value.module_name = canonical
  }
  // 普通模块：列表展示用自定义标题；若历史数据只有 module_name，则回填到标题字段
  if (item && !isSystemOrBannerModule(item) && item.module_template !== 'sub_nav_group' && !String(moduleForm.value.main_title || '').trim()) {
    moduleForm.value.main_title = item.module_name || ''
  }
  if (item?.module_template === 'sub_nav_group' && !String(moduleForm.value.module_name || '').trim()) {
    moduleForm.value.module_name = '子导航模块'
  }
  if (!item && moduleForm.value.module_template === 'sub_nav_group') {
    moduleForm.value.module_name = '子导航模块'
  }
  if ((isChildForm.value || SECTION_PAGES.includes(pageKey.value)) && ['image_text_split', 'multi_image_carousel'].includes(moduleForm.value.module_template)) {
    moduleForm.value.layout_mode = normalizeNewsLayoutMode(moduleForm.value.layout_mode)
  }
  if ((isChildForm.value || moduleForm.value.module_template === 'multi_image_carousel') && !moduleForm.value.image_list_json.length) {
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
  const err = await validateImage(file, 16 / 9, { tolerance: 0.12, ratioLabel: '16:9' })
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
  const parentId = Number(dialogParentId.value || moduleForm.value.parent_id || 0)
  const isChild = parentId > 0
  const isSubNav = moduleForm.value.module_template === 'sub_nav_group' && !isChild
  const isSystemOrBanner = formIsSystemOrBanner.value

  if (isSubNav) {
    if (!String(moduleForm.value.module_name || '').trim()) {
      moduleForm.value.module_name = '子导航模块'
    }
  } else if (isSystemOrBanner) {
    const canonical = canonicalSystemModuleName(editingModule.value) || canonicalSystemModuleName(moduleForm.value)
    if (canonical) moduleForm.value.module_name = canonical
    if (!moduleForm.value.module_name || !moduleForm.value.module_template) return
  } else {
    if (!String(moduleForm.value.main_title || '').trim()) {
      return alert('请填写自定义名称')
    }
    moduleForm.value.module_name = String(moduleForm.value.main_title).trim()
  }

  if (!editingModule.value && isChild) {
    const parent = (modules.value || []).find((m) => Number(m.id) === parentId)
    if (parent && !canAddChild(parent)) {
      alert(`子模块最多 ${SECTION_LIMIT} 个`)
      return
    }
  }

  if (isSystemOrBanner && showTitle.value && !moduleForm.value.main_title) return alert('请填写模块标题')
  if (!isSystemOrBanner && !isSubNav && !String(moduleForm.value.main_title || '').trim()) return alert('请填写自定义名称')
  if (showBody.value && !moduleForm.value.body_text) return alert('请填写正文内容')
  if (showImage.value) {
    const validCount = countValidImages(moduleForm.value.image_list_json)
    if (!validCount) return alert('请上传素材')
    if (isCarouselOnlyForm.value && validCount < 2) return alert('多图轮播至少上传 2 张统一 16:9 长方形图片')
    if (isChild || currentTemplate.value.code === 'multi_image_carousel') {
      moduleForm.value.image_list_json = moduleForm.value.image_list_json.filter((x) => x?.url)
      if (!moduleForm.value.image_list_json.length) return alert('请上传素材')
    }
  }
  if (currentTemplate.value.code === 'single_video_module' && !moduleForm.value.video_url) return alert('请上传视频')
  if (currentTemplate.value.code === 'image_jump_button') {
    if (moduleForm.value.jump_type === 'external' && !moduleForm.value.link_url) return alert('请填写外部链接')
    if (moduleForm.value.jump_type === 'product' && !moduleForm.value.jump_product_code) return alert('请填写产品编号')
  }
  if (isChild || (SECTION_PAGES.includes(pageKey.value) && moduleForm.value.module_template === 'image_text_split')) {
    moduleForm.value.layout_mode = normalizeNewsLayoutMode(moduleForm.value.layout_mode)
  }
  // 独立多图轮播：仅图片，清空正文
  if (isCarouselOnlyForm.value) {
    moduleForm.value.body_text = ''
    moduleForm.value.layout_mode = 'bottom'
  }
  savingModule.value = true
  try {
    const payload = {
      ...moduleForm.value,
      parent_id: parentId,
      image_list_json: Array.isArray(moduleForm.value.image_list_json)
        ? moduleForm.value.image_list_json.filter((x) => x?.url)
        : [],
    }
    if (isCarouselOnlyForm.value) {
      payload.body_text = ''
    }
    if (isContactInfoForm.value) {
      const info = contactInfoFromExtra(moduleForm.value.extra_json || {})
      payload.module_name = '联系方式模块'
      payload.module_template = 'image_text_split'
      payload.body_text = ''
      payload.image_list_json = []
      payload.extra_json = {
        ...(moduleForm.value.extra_json || {}),
        ...info,
        system_key: 'contact_info_block',
      }
    }
    if (isBannerForm.value) {
      const systemKey = String(
        editingModule.value?.extra_json?.system_key
        || moduleForm.value.extra_json?.system_key
        || `${pageKey.value}_banner`
      )
      payload.module_name = 'Banner模块'
      payload.extra_json = {
        ...(moduleForm.value.extra_json || {}),
        system_key: systemKey,
        subtitle_en: String(moduleForm.value.extra_json?.subtitle_en || '').trim(),
      }
    }
    if (isChild) {
      // Backend resolves template from image count
      payload.module_template = payload.module_template || 'image_text_split'
    }
    if (editingModule.value) await updatePageModule(editingModule.value.id, payload)
    else await createPageModule(pageKey.value, payload)
    showModuleDialog.value = false
    dialogParentId.value = 0
    await loadModules()
  } finally {
    savingModule.value = false
  }
}

async function deleteModuleRow(row) {
  if (isDeleteLockedModule(row) || isFixedTopModule(row)) return
  if (!window.confirm(`确认删除模块「${moduleDisplayName(row)}」吗？`)) return
  await deletePageModule(row.id)
  await loadModules()
}

function buildFullOrderAfterSiblingReorder(parentId, newSiblingOrderIds) {
  const pid = Number(parentId || 0)
  const all = [...(modules.value || [])]
  const siblingSet = new Set(newSiblingOrderIds.map((id) => Number(id)))
  const result = []
  let siblingInserted = false
  for (const row of all) {
    const rowPid = Number(row.parent_id || 0)
    if (rowPid === pid && siblingSet.has(Number(row.id))) {
      if (!siblingInserted) {
        newSiblingOrderIds.forEach((id) => result.push(Number(id)))
        siblingInserted = true
      }
      continue
    }
    result.push(Number(row.id))
  }
  if (!siblingInserted) {
    newSiblingOrderIds.forEach((id) => result.push(Number(id)))
  }
  // Deduplicate while preserving order
  const seen = new Set()
  return result.filter((id) => {
    if (seen.has(id)) return false
    seen.add(id)
    return true
  })
}

function onModuleDragStart(id, parentId = 0) {
  moduleDragId.value = id
  moduleDragParentId.value = Number(parentId || 0)
}

async function onModuleDrop(targetId, parentId = 0) {
  if (!moduleDragId.value || moduleDragId.value === targetId) return
  const dragParent = Number(moduleDragParentId.value || 0)
  const dropParent = Number(parentId || 0)
  if (dragParent !== dropParent) {
    moduleDragId.value = null
    return
  }

  if (dropParent === 0) {
    const rows = [...topLevelModules.value]
    const from = rows.findIndex((r) => r.id === moduleDragId.value)
    const to = rows.findIndex((r) => r.id === targetId)
    if (from < 0 || to < 0) return
    if (isFixedTopModule(rows[from]) || isFixedTopModule(rows[to])) {
      moduleDragId.value = null
      return
    }
    const [moving] = rows.splice(from, 1)
    rows.splice(to, 0, moving)
    const normalizedTop = normalizeFixedTopOrder(rows)
    const orderIds = buildFullOrderAfterSiblingReorder(0, normalizedTop.map((r) => r.id))
    await reorderPageModules(pageKey.value, { orderIds })
    modules.value = await getPageModules(pageKey.value, { includeHidden: 1 })
  } else {
    const rows = [...childrenOf(dropParent)]
    const from = rows.findIndex((r) => r.id === moduleDragId.value)
    const to = rows.findIndex((r) => r.id === targetId)
    if (from < 0 || to < 0) return
    const [moving] = rows.splice(from, 1)
    rows.splice(to, 0, moving)
    const orderIds = buildFullOrderAfterSiblingReorder(dropParent, rows.map((r) => r.id))
    await reorderPageModules(pageKey.value, { orderIds })
    modules.value = await getPageModules(pageKey.value, { includeHidden: 1 })
  }
  moduleDragId.value = null
  moduleDragParentId.value = 0
}

function openPreview() {
  const map = {
    home: '/',
    products: '/products',
    services: '/services',
    applications: '/applications',
    news: '/news',
    about: '/about',
    contact: '/contact',
  }
  const path = map[pageKey.value] || '/'
  const url = new URL(path, 'http://localhost:5173')
  url.searchParams.set('preview', '1')
  window.open(url.toString(), '_blank')
}

onMounted(async () => {
  await loadPages()
})

watch(
  () => [route.query.pageId, route.query.pageKey, route.query.name],
  async () => {
    if (!pages.value.length) return
    await applyRouteTarget()
  }
)

watch(
  () => moduleForm.value.module_template,
  (code) => {
    if (code === 'sub_nav_group' && !isChildForm.value) {
      if (!String(moduleForm.value.module_name || '').trim()) {
        moduleForm.value.module_name = '子导航模块'
      }
      moduleForm.value.image_list_json = []
      moduleForm.value.body_text = ''
    }
    if (code === 'multi_image_carousel' && !isChildForm.value) {
      moduleForm.value.body_text = ''
      if (!moduleForm.value.image_list_json?.length) {
        moduleForm.value.image_list_json = [{ name: '', url: '' }, { name: '', url: '' }]
      }
    }
  }
)
</script>

<style scoped>
.page-editor-sticky {
  position: sticky;
  top: var(--header-height);
  z-index: 40;
  margin: -24px -24px 16px;
  padding: 16px 24px 12px;
  background: var(--color-bg);
  border-bottom: 1px solid var(--color-border);
  box-shadow: 0 8px 16px -12px rgba(15, 23, 42, 0.35);
}
.page-editor-sticky .page-header {
  margin-bottom: 12px;
}
.page-tabs-card {
  margin-bottom: 0;
  padding: 12px 14px;
}
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



.module-pane-title {
  margin: 0 0 14px;
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
  line-height: 1.4;
}
.module-editor-shell {
  display: grid;
  gap: 12px;
}
.module-visual-list {
  display: grid;
  gap: 16px;
  max-width: 920px;
}
.visual-group,
.visual-block {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px;
  background: #f8fafc;
  display: grid;
  gap: 10px;
}
.visual-block.fixed {
  border-color: #93c5fd;
  background: #eff6ff;
}
.visual-group-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 32px;
}
.visual-group-body {
  display: grid;
  gap: 10px;
}
.visual-card {
  display: grid;
  gap: 8px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 10px;
}
.visual-card-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.visual-empty {
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  color: #94a3b8;
  font-size: 13px;
  background: #fff;
}
.module-type-name {
  font-size: 14px;
  line-height: 1.4;
  font-weight: 600;
  color: #0f172a;
  white-space: nowrap;
}
.module-style-name {
  font-size: 12px;
  line-height: 1.4;
  font-weight: 400;
  color: #94a3b8;
}
.badge {
  font-size: 11px;
  color: #1d4ed8;
  background: #dbeafe;
  border-radius: 999px;
  padding: 1px 8px;
  flex-shrink: 0;
  margin-left: 6px;
  vertical-align: middle;
}
.badge-fixed {
  color: #fff;
  background: #94a3b8;
}
.module-actions-inline .badge-fixed {
  margin-left: 0;
  margin-right: 2px;
}
.preview-text h5 .badge-fixed,
.contact-info-preview h5 .badge-fixed {
  margin-left: 6px;
}
.module-actions-inline {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 0;
}
.drag-handle.disabled {
  color: #94a3b8;
  cursor: not-allowed;
}
.preview-card,
.preview-card-inner {
  display: grid;
  gap: 12px;
  align-items: center;
  min-height: 100px;
  box-sizing: border-box;
}
.preview-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 10px;
}
.visual-card .preview-card {
  border: none;
  padding: 0;
  background: transparent;
  min-height: 0;
}
.preview-card.fixed {
  border-color: #93c5fd;
  background: #f8fbff;
}
.preview-image-text.layout-left,
.preview-image-text.layout-right {
  grid-template-columns: 1fr 1fr;
}
.preview-image-text.layout-left .preview-media { order: 1; }
.preview-image-text.layout-left .preview-text { order: 2; }
.preview-image-text.layout-right .preview-text { order: 1; }
.preview-image-text.layout-right .preview-media { order: 2; }
.preview-image-text.layout-bottom {
  grid-template-columns: 1fr;
}
.preview-image-text.layout-bottom .preview-text { order: 1; }
.preview-image-text.layout-bottom .preview-media { order: 2; }
.preview-top-card > .preview-card-inner {
  border: none;
  padding: 0;
  background: transparent;
}
.preview-media,
.preview-text {
  min-width: 0;
}
.preview-media {
  border-radius: 8px;
  overflow: hidden;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  aspect-ratio: 16 / 9;
  display: flex;
  align-items: stretch;
  justify-content: center;
  position: relative;
}
.preview-media-wide {
  aspect-ratio: 16 / 6;
}
.preview-media :deep(.preview-auto-carousel),
.preview-media :deep(.preview-stage),
.preview-media :deep(.preview-auto-img),
.preview-media :deep(img),
.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  margin: 0;
  border-radius: 0;
  aspect-ratio: auto;
}
.preview-media :deep(.preview-auto-dots) {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 6px;
  margin: 0;
  z-index: 2;
}
.preview-media-empty {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-size: 12px;
}
.preview-text {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
  min-height: 72px;
}
.preview-text h5 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
  line-height: 1.35;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}
.preview-text p {
  margin: 0;
  font-size: 13px;
  color: #64748b;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.preview-sub-en {
  margin: -2px 0 0 !important;
  font-size: 11px !important;
  letter-spacing: 0.06em;
  color: #94a3b8 !important;
  -webkit-line-clamp: 1 !important;
}
.preview-video,
.preview-list-placeholder {
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  padding: 18px;
  text-align: left;
  color: #475569;
  min-height: 96px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 6px;
  border-color: #a7f3d0;
  background: #f0fdf4;
  color: #15803d;
}
.preview-list-placeholder h5 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}
.preview-list-placeholder p {
  margin: 0;
  font-size: 13px;
  color: #64748b;
  line-height: 1.5;
}
.preview-list-placeholder .badge-fixed {
  margin-left: 6px;
}
.contact-info-preview {
  display: grid;
  gap: 10px;
}
.contact-info-preview h5 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.contact-info-preview-grid {
  display: grid;
  gap: 12px;
}
.contact-info-preview-text {
  display: grid;
  gap: 6px;
}
.contact-info-preview-text p {
  margin: 0;
  font-size: 12px;
  color: #334155;
  line-height: 1.5;
}
.contact-info-preview-text span {
  display: inline-block;
  min-width: 52px;
  color: #94a3b8;
  margin-right: 6px;
}

.layout-schemes {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
.layout-scheme {
  width: 88px;
  height: 64px;
  padding: 0;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  background: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
}
.layout-scheme:hover {
  border-color: #93c5fd;
  background: #f8fbff;
}
.layout-scheme.active {
  border-color: #0b2d5c;
  background: #eff6ff;
  box-shadow: 0 0 0 2px rgba(11, 45, 92, 0.12);
}
.scheme-frame {
  width: 64px;
  height: 40px;
  display: grid;
  gap: 4px;
  pointer-events: none;
}
.scheme-text-left,
.scheme-text-right {
  grid-template-columns: 1fr 1fr;
  align-items: stretch;
}
.scheme-text-top {
  grid-template-rows: auto 1fr;
}
.scheme-text {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 3px;
  min-width: 0;
}
.scheme-text i {
  display: block;
  height: 3px;
  border-radius: 2px;
  background: #94a3b8;
}
.scheme-text i:nth-child(1) { width: 100%; }
.scheme-text i:nth-child(2) { width: 82%; }
.scheme-text i:nth-child(3) { width: 64%; }
.scheme-img {
  display: block;
  border-radius: 3px;
  background: #cbd5e1;
  min-height: 100%;
}
.scheme-text-top .scheme-text { order: 1; }
.scheme-text-top .scheme-img {
  order: 2;
  min-height: 18px;
}
.scheme-text-left .scheme-text { order: 1; }
.scheme-text-left .scheme-img { order: 2; }
.scheme-text-right .scheme-img { order: 1; }
.scheme-text-right .scheme-text { order: 2; }
.layout-scheme.active .scheme-text i {
  background: #64748b;
}
.layout-scheme.active .scheme-img {
  background: #94a3b8;
}
@media (max-width: 720px) {
  .preview-image-text.layout-left,
  .preview-image-text.layout-right {
    grid-template-columns: 1fr;
  }
  .preview-image-text.layout-left .preview-text,
  .preview-image-text.layout-right .preview-text { order: 1; }
  .preview-image-text.layout-left .preview-media,
  .preview-image-text.layout-right .preview-media { order: 2; }
}
</style>
