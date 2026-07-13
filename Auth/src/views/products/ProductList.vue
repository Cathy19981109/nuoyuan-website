<template>
  <div>
    <div class="page-header">
      <div>
        <h2>{{ pageTitle }}</h2>
        <p class="desc">{{ pageDesc }}</p>
      </div>
      <div class="toolbar">
        <button class="btn btn-secondary" @click="openBatchCodes">批量导入商品编码</button>
        <button class="btn btn-primary" @click="openForm()">新增产品</button>
      </div>
    </div>

    <div class="toolbar">
      <select v-model="filterCategory" class="form-control" style="max-width:180px" @change="loadData(1)">
        <option value="">全部导航分类</option>
        <option v-for="c in flatCategories" :key="c.id" :value="c.id">{{ '　'.repeat(c.depth) + c.name }}</option>
      </select>
      <select v-model="filterProductType" class="form-control" style="max-width:170px" @change="loadData(1)">
        <option value="">{{ isServiceMode ? '全部服务类型' : '全部产品类型' }}</option>
        <option v-for="tag in filterTags.product_type || []" :key="tag.id" :value="tag.name">{{ tag.name }}</option>
      </select>
      <select v-model="filterAppType" class="form-control" style="max-width:170px" @change="loadData(1)">
        <option value="">全部应用分类</option>
        <option v-for="tag in filterTags.app_type || []" :key="tag.id" :value="tag.name">{{ tag.name }}</option>
      </select>
      <select v-model="filterLevelTag" class="form-control" style="max-width:170px" @change="loadData(1)">
        <option value="">全部级别</option>
        <option v-for="tag in filterTags.level_tag || []" :key="tag.id" :value="tag.name">{{ tag.name }}</option>
      </select>
      <input v-model="keyword" class="form-control" style="max-width:200px" :placeholder="isServiceMode ? '搜索服务名称' : '搜索产品名称'" @keyup.enter="loadData(1)" />
      <button class="btn btn-secondary" @click="loadData(1)">搜索</button>
    </div>

    <div class="card">
      <div v-if="loading" class="empty-state">加载中...</div>
      <div v-else-if="!list.length" class="empty-state">暂无产品</div>
      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>序号</th>
              <th>产品5位编号</th>
              <th>商品编码</th>
              <th>名称</th>
              <th>所属导航分类</th>
              <th>热门</th>
              <th>状态</th>
              <th>浏览量</th>
              <th>拖拽排序</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(item, idx) in list"
              :key="item.id"
              draggable="true"
              @dragstart="onDragStart(item.id)"
              @dragover.prevent
              @drop="onDrop(item.id)"
            >
              <td>{{ formatSerial(idx) }}</td>
              <td>{{ item.product_code || '-' }}</td>
              <td>{{ item.goods_code || '-' }}</td>
              <td>{{ item.name }}</td>
              <td>{{ getCategoryName(item.category_id) }}</td>
              <td><span :class="['tag', item.is_hot ? 'tag-warning' : 'tag-default']">{{ item.is_hot ? '是' : '否' }}</span></td>
              <td><span :class="['tag', STATUS_MAP[item.status]?.class]">{{ STATUS_MAP[item.status]?.label }}</span></td>
              <td>{{ item.view_count }}</td>
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
          <h3>{{ editing ? '编辑产品' : '新增产品' }}</h3>
          <button class="modal-close" @click="showForm = false">&times;</button>
        </div>
        <div class="modal-body">
          <div v-if="formError" class="alert alert-error">{{ formError }}</div>
          <div class="form-row">
            <div class="form-group">
              <label><span class="required">*</span> {{ itemNameLabel }}</label>
              <input v-model="form.name" class="form-control" />
            </div>
            <div class="form-group">
              <label>英文名称</label>
              <input v-model="form.en_name" class="form-control" />
            </div>
          </div>
          <div class="form-group">
            <label><span class="required">*</span> {{ categoryLabel }}</label>
            <div class="category-picker">
              <button type="button" class="form-control category-trigger" @click="categoryPanelOpen = !categoryPanelOpen">
                {{ selectedCategoryLabel || '请选择导航分类' }}
              </button>
              <div v-if="categoryPanelOpen" class="category-panel">
                <input class="form-control" value="请直接选择导航分类（一级或二级）" disabled />
                <div class="category-list">
                  <button
                    v-for="c in filteredFlatCategories"
                    :key="c.id"
                    type="button"
                    class="category-item"
                    @click="selectCategory(c.id)"
                  >
                    {{ '　'.repeat(c.depth) + c.name }}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>产品5位编号</label>
              <input :value="form.product_code || '系统自动生成'" class="form-control" disabled />
            </div>
            <div class="form-group">
              <label>商品编码（筛选匹配）</label>
              <input v-model="form.goods_code" class="form-control" placeholder="如 NY-RNA-001" />
            </div>
          </div>
          <div
            v-for="group in filterGroups"
            :key="group.key"
            class="form-group"
          >
            <label>
              {{ group.title }}
              <FieldHint text="【筛选条件必选】每个筛选大类至少勾选1项，可多选" />
            </label>
            <div class="multi-tags">
              <label
                v-for="tag in filterTags[group.key] || []"
                :key="tag.id || tag.name"
                class="multi-tag-item"
              >
                <input
                  type="checkbox"
                  :checked="(form.filter_tags?.[group.key] || []).includes(tag.name)"
                  @change="toggleGroupTag(group.key, tag.name)"
                />
                <span>{{ tag.name }}</span>
              </label>
            </div>
          </div>
          <div class="form-group">
            <label><span class="required">*</span> 产品图片（逐张上传，第一张默认封面）</label>
            <div class="hint" style="color:#1d4ed8">上传规范：16:9，建议1920x720，png/jpg/webp，单张不超过50MB</div>
            <div class="gallery-grid single-upload-list">
              <div
                v-for="(item, idx) in form.gallery_json"
                :key="item.uid || idx"
                class="gallery-chip"
                draggable="true"
                @dragstart="onGalleryDragStart(idx)"
                @dragover.prevent
                @drop="onGalleryDrop(idx)"
              >
                <div class="gallery-row">
                  <input type="file" accept=".png,.jpg,.jpeg,.webp" @change="(e) => onGalleryItemSelect(e, idx)" />
                  <span class="gallery-name">{{ item.name || `上传位${idx + 1}` }}</span>
                  <span v-if="idx === 0" class="cover-badge">默认封面</span>
                  <button type="button" class="btn btn-danger btn-sm" @click="removeGallery(idx)">删除</button>
                </div>
                <img v-if="item.url" :src="item.url" class="gallery-thumb" />
              </div>
            </div>
            <button type="button" class="btn btn-secondary add-upload-btn" @click="addGallerySlot">+ 新增上传框</button>
          </div>
          <div class="form-group">
            <label>产品视频（展示在第一张图之后）</label>
            <div class="hint" style="color:#1d4ed8">支持 mp4，大小不超过1GB</div>
            <div class="gallery-row">
              <input type="file" accept=".mp4,video/mp4" @change="onVideoSelect" />
              <button v-if="form.video_url" type="button" class="btn btn-danger btn-sm" @click="form.video_url = ''">移除视频</button>
            </div>
            <video v-if="form.video_url" :src="form.video_url" class="gallery-thumb" controls />
          </div>
          <div class="form-group">
            <label><span class="required">*</span> 简短简介</label>
            <textarea v-model="form.short_desc" class="form-control" rows="2" />
          </div>
          <div class="form-group">
            <label>产品规格</label>
            <input v-model="form.spec_text" class="form-control" placeholder="例如：1mg/支；10次实验" />
          </div>
          <div class="form-group">
            <label>核心优势</label>
            <textarea v-model="form.core_advantage" class="form-control" rows="2" />
          </div>
          <div class="form-group">
            <label>详情富文本（支持段落、表格、图片链接、文献链接）</label>
            <textarea v-model="form.detail_richtext" class="form-control" rows="8" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>热门推荐</label>
              <select v-model="form.is_hot" class="form-control">
                <option :value="1">是</option>
                <option :value="0">否</option>
              </select>
            </div>
            <div class="form-group">
              <label>状态</label>
              <select v-model="form.status" class="form-control">
                <option :value="1">上架</option>
                <option :value="0">下架</option>
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

    <div v-if="showBatchCodes" class="modal-overlay" @click.self="showBatchCodes = false">
      <div class="modal">
        <div class="modal-header">
          <h3>批量导入商品编码</h3>
          <button class="modal-close" @click="showBatchCodes = false">&times;</button>
        </div>
        <div class="modal-body">
          <p class="desc">每行一条：产品ID,商品编码（例如：12,NY-RNA-001）</p>
          <textarea v-model="batchCodesText" class="form-control" rows="8" />
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showBatchCodes = false">取消</button>
          <button class="btn btn-primary" @click="saveBatchCodes">确认导入</button>
        </div>
      </div>
    </div>

    <div v-if="imageEditorVisible" class="modal-overlay" @click.self="closeImageEditor">
      <div class="modal modal-lg">
        <div class="modal-header">
          <h3>图片裁剪调整</h3>
          <button class="modal-close" @click="closeImageEditor">&times;</button>
        </div>
        <div class="modal-body">
          <div class="hint" style="margin-bottom:8px;color:#1d4ed8">当前图片不符合 16:9，将裁剪为合规比例后上传</div>
          <div class="crop-stage">
            <img :src="imageEditorSourceUrl" class="crop-img" :style="cropImageStyle" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>缩放</label>
              <input v-model.number="imageEditorScale" type="range" min="1" max="3" step="0.01" class="form-control" />
            </div>
            <div class="form-group">
              <label>横向位置</label>
              <input v-model.number="imageEditorOffset.x" type="range" min="-1" max="1" step="0.01" class="form-control" />
            </div>
            <div class="form-group">
              <label>纵向位置</label>
              <input v-model.number="imageEditorOffset.y" type="range" min="-1" max="1" step="0.01" class="form-control" />
            </div>
          </div>
          <img v-if="imageEditorPreview" :src="imageEditorPreview" class="gallery-thumb" />
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeImageEditor">取消</button>
          <button class="btn btn-primary" @click="confirmImageEditor">确认裁剪并上传</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  getNavList,
  getProductList,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  reorderProducts,
  uploadImageFile,
  uploadVideoFile,
  getProductFilterTags,
  getServiceFilterTags,
  getServiceCategories,
  getServiceList,
  getServiceById,
  createService,
  updateService,
  deleteService,
  reorderServices,
} from '@/api'
import { flattenTree, confirmAction, STATUS_MAP } from '@/utils/helpers'
import FieldHint from '@/components/FieldHint.vue'

const route = useRoute()
const loading = ref(false)
const saving = ref(false)
const showForm = ref(false)
const formError = ref('')
const editing = ref(null)
const list = ref([])
const categories = ref([])
const keyword = ref('')
const filterCategory = ref('')
const filterProductType = ref('')
const filterAppType = ref('')
const filterLevelTag = ref('')
const page = ref(1)
const pagination = ref({ total: 0, totalPages: 1 })
const pageSize = ref(20)
const jumpPage = ref(1)
const showBatchCodes = ref(false)
const batchCodesText = ref('')
const galleryDragIndex = ref(null)
const categoryPanelOpen = ref(false)
const imageEditorVisible = ref(false)
const imageEditorIndex = ref(-1)
const imageEditorFileName = ref('')
const imageEditorNatural = ref({ width: 0, height: 0 })
const imageEditorScale = ref(1)
const imageEditorOffset = ref({ x: 0, y: 0 })
const imageEditorPreview = ref('')
const imageEditorSourceUrl = ref('')
const imageEditorMime = ref('')
const imageEditorRatio = 16 / 9

const defaultForm = () => ({
  category_id: '', name: '', en_name: '', short_desc: '', core_advantage: '',
  content: '', detail_richtext: '', cover_image: '', banner_image: '', goods_code: '', spec_text: '', video_url: '',
  product_type: [], app_type: [], level_tag: [],
  filter_tags: {},
  gallery_json: [{ name: '上传位1', url: '', uid: String(Date.now()) }], is_hot: 0, status: 1,
})
const form = ref(defaultForm())
const dragId = ref(null)
const filterTags = ref({ product_type: [], app_type: [], level_tag: [] })
const filterGroups = ref([])

const flatCategories = computed(() => flattenTree(categories.value))
const isServiceMode = computed(() => route.name === 'ServicesAdmin')
const pageTitle = computed(() => (isServiceMode.value ? '服务列表' : '产品列表'))
const pageDesc = computed(() => (isServiceMode.value ? '可视化维护技术服务信息、逐张上传展示图、详情内容与商品编码' : '可视化维护产品信息、逐张上传展示图、详情内容与商品编码'))
const itemNameLabel = computed(() => (isServiceMode.value ? '服务名称' : '产品名称'))
const categoryLabel = computed(() => '所属导航分类')
const selectedCategoryLabel = computed(() => {
  const hit = flatCategories.value.find((c) => Number(c.id) === Number(form.value.category_id))
  return hit ? `${'　'.repeat(hit.depth)}${hit.name}` : ''
})
const filteredFlatCategories = computed(() => flatCategories.value)
const cropImageStyle = computed(() => {
  const tx = imageEditorOffset.value.x * 120
  const ty = imageEditorOffset.value.y * 120
  return {
    transform: `translate(${tx}px, ${ty}px) scale(${imageEditorScale.value})`,
    transformOrigin: 'center center',
  }
})

async function loadCategories() {
  if (isServiceMode.value) {
    categories.value = await getServiceCategories()
    return
  }
  const navTree = await getNavList()
  const pickLevel12 = (nodes = [], depth = 0) => (nodes || []).map((n) => ({
    id: n.id,
    parent_id: n.parent_id || 0,
    name: n.name,
    en_name: n.en_name,
    depth,
    children: depth < 1 ? pickLevel12(n.children || [], depth + 1) : [],
  }))
  categories.value = pickLevel12(Array.isArray(navTree) ? navTree : [], 0)
}

async function loadFilterTags() {
  const data = isServiceMode.value ? await getServiceFilterTags() : await getProductFilterTags()
  filterTags.value = data || {}
  filterGroups.value = Array.isArray(data?.groups) ? data.groups : []
}

async function loadData(p = page.value) {
  loading.value = true
  page.value = p
  try {
    const params = { page: p, pageSize: pageSize.value, keyword: keyword.value }
    if (filterCategory.value) params.categoryId = filterCategory.value
    if (filterProductType.value) params.productType = filterProductType.value
    if (filterAppType.value) params.appType = filterAppType.value
    if (filterLevelTag.value) params.levelTag = filterLevelTag.value
    const dynamicFilters = {}
    filterGroups.value.forEach((g) => {
      if (g.key === 'product_type' && filterProductType.value) dynamicFilters[g.key] = [filterProductType.value]
      if (g.key === 'app_type' && filterAppType.value) dynamicFilters[g.key] = [filterAppType.value]
      if (g.key === 'level_tag' && filterLevelTag.value) dynamicFilters[g.key] = [filterLevelTag.value]
    })
    if (Object.keys(dynamicFilters).length) params.tagFilters = JSON.stringify(dynamicFilters)
    const data = isServiceMode.value ? await getServiceList(params) : await getProductList(params)
    list.value = data.list
    pagination.value = data.pagination
  } catch (e) { alert(e.message) }
  finally { loading.value = false }
}

async function openForm(item = null) {
  editing.value = item
  if (item) {
    try {
      const data = isServiceMode.value ? await getServiceById(item.id) : await getProductById(item.id)
      form.value = {
        ...data,
        category_id: Number(data.category_id),
        gallery_json: normalizeGallery(data.gallery_json),
        filter_tags: { ...(data.filter_tags || {}) },
        product_type: (data.product_type_list || []).slice(),
        app_type: (data.app_type_list || []).slice(),
        level_tag: (data.level_tag_list || []).slice(),
      }
    }
    catch (e) { alert(e.message); return }
  } else {
    form.value = defaultForm()
    if (flatCategories.value.length) form.value.category_id = flatCategories.value[0].id
  }
  formError.value = ''
  showForm.value = true
}

async function handleSave() {
  if (!form.value.name || !form.value.short_desc || !form.value.category_id) {
    formError.value = '请填写必填项'; return
  }
  saving.value = true
  try {
    if (!form.value.gallery_json?.length) {
      formError.value = '请至少上传1张产品图片'
      return
    }
    const uploadedGallery = (form.value.gallery_json || []).filter((item) => item?.url)
    if (!uploadedGallery.length) {
      formError.value = '请先上传至少1张产品图片'
      return
    }
    const miss = filterGroups.value.find((g) => !(form.value.filter_tags?.[g.key] || []).length)
    if (miss) {
      formError.value = `请至少选择1项「${miss.title}」`
      return
    }
    const payload = {
      ...form.value,
      category_id: Number(form.value.category_id),
      gallery_json: uploadedGallery,
      cover_image: uploadedGallery[0].url,
      banner_image: uploadedGallery[0].url,
      video_url: form.value.video_url || null,
      filter_tags: form.value.filter_tags || {},
    }
    if (editing.value) {
      if (isServiceMode.value) await updateService(editing.value.id, payload)
      else await updateProduct(editing.value.id, payload)
    } else if (isServiceMode.value) {
      await createService(payload)
    } else {
      await createProduct(payload)
    }
    showForm.value = false
    await loadData()
  } catch (e) { formError.value = e.message }
  finally { saving.value = false }
}

async function handleDelete(item) {
  if (!confirmAction(`确定删除${isServiceMode.value ? '服务' : '产品'}「${item.name}」吗？`)) return
  try {
    if (isServiceMode.value) await deleteService(item.id)
    else await deleteProduct(item.id)
    await loadData()
  }
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
    if (isServiceMode.value) await reorderServices({ orderIds: rows.map((item) => item.id) })
    else await reorderProducts({ orderIds: rows.map((item) => item.id) })
    await loadData()
  } catch (e) {
    alert(e.message)
  }
  dragId.value = null
}

onMounted(async () => {
  await loadCategories()
  await loadFilterTags()
  await loadData()
})

function goJump() {
  const t = Number(jumpPage.value || 1)
  const safe = Math.min(Math.max(t, 1), pagination.value.totalPages || 1)
  loadData(safe)
}

function formatSerial(idx) {
  const no = (page.value - 1) * pageSize.value + idx + 1
  const safe = Math.min(Math.max(no, 1), 99999)
  return safe
}

function getCategoryName(categoryId) {
  const hit = flatCategories.value.find((c) => Number(c.id) === Number(categoryId))
  return hit ? `${'　'.repeat(hit.depth)}${hit.name}` : categoryId
}

function openBatchCodes() {
  batchCodesText.value = ''
  showBatchCodes.value = true
}

function selectCategory(id) {
  form.value.category_id = Number(id)
  categoryPanelOpen.value = false
}

async function saveBatchCodes() {
  const lines = batchCodesText.value.split('\n').map((line) => line.trim()).filter(Boolean)
  try {
    await Promise.all(lines.map(async (line) => {
      const [idText, goodsCode] = line.split(',').map((v) => (v || '').trim())
      if (!idText || !goodsCode) return
      if (isServiceMode.value) await updateService(Number(idText), { goods_code: goodsCode })
      else await updateProduct(Number(idText), { goods_code: goodsCode })
    }))
    showBatchCodes.value = false
    await loadData()
  } catch (e) {
    alert(e.message)
  }
}

function toggleMultiTag(field, tagName) {
  const current = Array.isArray(form.value[field]) ? form.value[field] : []
  if (current.includes(tagName)) {
    form.value[field] = current.filter((v) => v !== tagName)
  } else {
    form.value[field] = [...current, tagName]
  }
}

function toggleGroupTag(groupKey, tagName) {
  const map = { ...(form.value.filter_tags || {}) }
  const current = Array.isArray(map[groupKey]) ? map[groupKey] : []
  if (current.includes(tagName)) map[groupKey] = current.filter((v) => v !== tagName)
  else map[groupKey] = [...current, tagName]
  form.value.filter_tags = map
  if (groupKey === 'product_type') form.value.product_type = map[groupKey]
  if (groupKey === 'app_type') form.value.app_type = map[groupKey]
  if (groupKey === 'level_tag') form.value.level_tag = map[groupKey]
}

function parseImageRule() {
  return { allowedTypes: ['image/png', 'image/jpeg', 'image/webp'], maxSize: 50 * 1024 * 1024, ratio: 16 / 9 }
}

function getImageSize(file) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.width, height: img.height })
    img.onerror = () => resolve({ width: 0, height: 0 })
    img.src = URL.createObjectURL(file)
  })
}

async function validateImage(file) {
  const rule = parseImageRule()
  if (!rule.allowedTypes.includes(file.type)) return '仅支持 png/jpg/webp 格式'
  if (file.size > 80 * 1024 * 1024) return '图片过大，无法处理，请先压缩到80MB以内再上传'
  const size = await getImageSize(file)
  const ratio = size.width && size.height ? size.width / size.height : 0
  const needCrop = Math.abs(ratio - rule.ratio) > 0.12
  const needCompress = file.size > rule.maxSize
  return { needCrop, needCompress, size }
}

function normalizeGallery(list) {
  const rows = Array.isArray(list)
    ? list.map((item, idx) => ({
      name: item?.name || `图片${idx + 1}`,
      url: item?.url || '',
      uid: `${Date.now()}-${idx}`,
    }))
    : []
  return rows.length ? rows : [{ name: '上传位1', url: '', uid: String(Date.now()) }]
}

function addGallerySlot() {
  if ((form.value.gallery_json || []).length >= 10) {
    alert('最多上传10张图片')
    return
  }
  form.value.gallery_json.push({
    name: `上传位${form.value.gallery_json.length + 1}`,
    url: '',
    uid: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  })
}

async function onGalleryItemSelect(e, idx) {
  const file = e.target.files?.[0]
  if (!file) return
  const checked = await validateImage(file)
  if (typeof checked === 'string') {
    alert(checked)
    e.target.value = ''
    return
  }
  if (checked.needCrop) {
    await openImageEditor(file, idx, checked.size)
    e.target.value = ''
    return
  }
  try {
    const uploadFile = checked.needCompress ? await compressToLimit(file, parseImageRule().maxSize) : file
    const fd = new FormData()
    fd.append('file', uploadFile, file.name)
    const uploaded = await uploadImageFile(fd)
    const next = [...(form.value.gallery_json || [])]
    next[idx] = { ...next[idx], name: file.name, url: uploaded.url }
    form.value.gallery_json = next
  } catch (error) {
    alert(error.message || '上传失败，请重试')
  } finally {
    e.target.value = ''
  }
}

function removeGallery(idx) {
  form.value.gallery_json.splice(idx, 1)
  if (!form.value.gallery_json.length) addGallerySlot()
}

function onGalleryDragStart(idx) {
  galleryDragIndex.value = idx
}

function onGalleryDrop(targetIdx) {
  const from = galleryDragIndex.value
  if (from === null || from === targetIdx) return
  const rows = [...form.value.gallery_json]
  const [moving] = rows.splice(from, 1)
  rows.splice(targetIdx, 0, moving)
  form.value.gallery_json = rows
  galleryDragIndex.value = null
}

async function onVideoSelect(e) {
  const file = e.target.files?.[0]
  if (!file) return
  if (file.type !== 'video/mp4') {
    alert('视频仅支持 mp4 格式')
    e.target.value = ''
    return
  }
  if (file.size > 1024 * 1024 * 1024) {
    alert('视频大小不能超过1GB')
    e.target.value = ''
    return
  }
  try {
    const fd = new FormData()
    fd.append('file', file)
    const uploaded = await uploadVideoFile(fd)
    form.value.video_url = uploaded.url
  } catch (error) {
    alert(error.message || '视频上传失败，请重试')
  } finally {
    e.target.value = ''
  }
}

function closeImageEditor() {
  imageEditorVisible.value = false
  imageEditorIndex.value = -1
  imageEditorFileName.value = ''
  imageEditorNatural.value = { width: 0, height: 0 }
  imageEditorScale.value = 1
  imageEditorOffset.value = { x: 0, y: 0 }
  imageEditorPreview.value = ''
  imageEditorSourceUrl.value = ''
  imageEditorMime.value = ''
}

async function openImageEditor(file, idx, size) {
  imageEditorIndex.value = idx
  imageEditorFileName.value = file.name
  imageEditorNatural.value = { width: size.width, height: size.height }
  imageEditorScale.value = 1
  imageEditorOffset.value = { x: 0, y: 0 }
  imageEditorMime.value = file.type || 'image/jpeg'
  imageEditorSourceUrl.value = URL.createObjectURL(file)
  imageEditorPreview.value = imageEditorSourceUrl.value
  imageEditorVisible.value = true
}

function blobToImage(blobOrUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = typeof blobOrUrl === 'string' ? blobOrUrl : URL.createObjectURL(blobOrUrl)
  })
}

async function renderCroppedBlob({ src, width, height, scale, offsetX, offsetY, targetRatio, mimeType }) {
  const img = await blobToImage(src)
  const cropW = width
  const cropH = Math.round(width / targetRatio)
  const safeCropH = cropH <= height ? cropH : height
  const safeCropW = safeCropH * targetRatio
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(safeCropW)
  canvas.height = Math.round(safeCropH)
  const ctx = canvas.getContext('2d')
  const drawW = width * scale
  const drawH = height * scale
  const centerX = (canvas.width - drawW) / 2 + offsetX * 120
  const centerY = (canvas.height - drawH) / 2 + offsetY * 120
  ctx.drawImage(img, centerX, centerY, drawW, drawH)
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) return reject(new Error('图片处理失败'))
      resolve(blob)
    }, mimeType === 'image/png' ? 'image/png' : 'image/jpeg', 0.92)
  })
}

async function compressToLimit(file, maxSize) {
  if (file.size <= maxSize) return file
  const img = await blobToImage(file)
  let quality = 0.9
  let blob = await new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    canvas.width = img.width
    canvas.height = img.height
    ctx.drawImage(img, 0, 0, img.width, img.height)
    canvas.toBlob(resolve, 'image/jpeg', quality)
  })
  while (blob && blob.size > maxSize && quality > 0.4) {
    quality -= 0.1
    blob = await new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0, img.width, img.height)
      canvas.toBlob(resolve, 'image/jpeg', quality)
    })
  }
  if (!blob) throw new Error('图片压缩失败')
  if (blob.size > maxSize) throw new Error('图片压缩后仍超过50MB，请更换更小图片')
  return new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' })
}

async function compressBlobToLimit(blob, maxSize) {
  if (blob.size <= maxSize) return blob
  const img = await blobToImage(blob)
  let quality = 0.9
  let result = blob
  while (result.size > maxSize && quality > 0.4) {
    quality -= 0.1
    result = await new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0, img.width, img.height)
      canvas.toBlob(resolve, 'image/jpeg', quality)
    })
  }
  if (result.size > maxSize) throw new Error('裁剪后图片仍超过50MB，请调整图片后重试')
  return result
}

async function confirmImageEditor() {
  try {
    const blob = await renderCroppedBlob({
      src: imageEditorSourceUrl.value,
      width: imageEditorNatural.value.width,
      height: imageEditorNatural.value.height,
      scale: imageEditorScale.value,
      offsetX: imageEditorOffset.value.x,
      offsetY: imageEditorOffset.value.y,
      targetRatio: imageEditorRatio,
      mimeType: imageEditorMime.value,
    })
    const compressed = await compressBlobToLimit(blob, parseImageRule().maxSize)
    const fd = new FormData()
    fd.append('file', compressed, imageEditorFileName.value || `crop-${Date.now()}.jpg`)
    const uploaded = await uploadImageFile(fd)
    const next = [...(form.value.gallery_json || [])]
    next[imageEditorIndex.value] = { ...next[imageEditorIndex.value], name: imageEditorFileName.value, url: uploaded.url }
    form.value.gallery_json = next
    closeImageEditor()
  } catch (error) {
    alert(error.message || '裁剪上传失败，请重试')
  }
}
</script>

<style scoped>
.drag-handle { color: #2563eb; font-size: 12px; cursor: grab; }
.required { color: #dc2626; margin-right: 4px; font-weight: 700; }
.gallery-grid { margin-top: 10px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.single-upload-list { grid-template-columns: 1fr; }
.gallery-chip { border: 1px dashed #cbd5e1; padding: 8px; border-radius: 8px; display: grid; gap: 8px; }
.gallery-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.gallery-name { color: #334155; font-size: 13px; }
.gallery-thumb { width: 180px; max-width: 100%; aspect-ratio: 16 / 9; object-fit: cover; border-radius: 8px; border: 1px solid #e2e8f0; }
.cover-badge { background: #16a34a; color: #fff; font-size: 12px; border-radius: 12px; padding: 2px 8px; }
.add-upload-btn { margin-top: 10px; width: 100%; }
.multi-tags { display: flex; flex-wrap: wrap; gap: 10px 12px; padding: 8px 0; }
.multi-tag-item { display: inline-flex; align-items: center; gap: 6px; color: #334155; font-size: 13px; }
.category-picker { display: grid; gap: 8px; }
.category-trigger { text-align: left; background: #fff; }
.category-panel {
  border: 1px solid #dbeafe;
  border-radius: 8px;
  padding: 8px;
  background: #f8fbff;
  display: grid;
  gap: 8px;
}
.category-list { max-height: 180px; overflow: auto; display: grid; gap: 4px; }
.category-item {
  border: 1px solid #e2e8f0;
  background: #fff;
  border-radius: 6px;
  padding: 7px 10px;
  text-align: left;
  cursor: pointer;
}
.category-item:hover { background: #eff6ff; border-color: #93c5fd; }
.crop-stage {
  width: 100%;
  max-width: 760px;
  aspect-ratio: 16 / 9;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  overflow: hidden;
  background: #f8fafc;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.crop-img {
  max-width: 100%;
  max-height: 100%;
  user-select: none;
  pointer-events: none;
}
</style>
