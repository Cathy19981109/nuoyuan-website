<template>
  <div>
    <div class="page-header">
      <div>
        <h2>SEO管理</h2>
        <p class="desc">统一维护全站、栏目、单品/资讯 SEO；资讯正文请在「导航&amp;页面管理 → 页面编辑」维护，此处仅编辑 SEO 字段</p>
      </div>
      <button class="btn btn-primary" @click="openSourceCheck">前台源码校验</button>
    </div>

    <div class="seo-layout">
      <div class="card">
        <div class="tabs-row">
          <button class="tab-btn" :class="{ active: tab === 'global' }" @click="tab = 'global'">全站基础SEO</button>
          <button class="tab-btn" :class="{ active: tab === 'page' }" @click="tab = 'page'">栏目页面SEO</button>
          <button class="tab-btn" :class="{ active: tab === 'item' }" @click="tab = 'item'">单品/资讯SEO</button>
        </div>

        <template v-if="tab === 'global'">
          <div class="form-group">
            <label>网站首页标题 <FieldHint text="【作用】搜索结果主标题\n【规范】20-30字\n【示例】诺元智合｜CRISPR基因编辑服务 科研实验试剂供应商" /></label>
            <input v-model="global.seo_home_title" class="form-control" />
            <div class="counter">{{ count(global.seo_home_title) }}/30</div>
          </div>
          <div class="form-group">
            <label>全站SEO关键词 <FieldHint text="【作用】匹配搜索词\n【规范】8-15个词，中文逗号分隔\n【示例】诺元智合，基因编辑服务，CRISPR/Cas9" /></label>
            <textarea v-model="global.seo_global_keywords" rows="3" class="form-control" />
          </div>
          <div class="form-group">
            <label>全站SEO描述 <FieldHint text="【作用】搜索结果灰色摘要\n【规范】120-180字\n【示例】诺元智合专注CRISPR基因编辑核心服务..." /></label>
            <textarea v-model="global.seo_global_description" rows="4" class="form-control" />
            <div class="counter">{{ count(global.seo_global_description) }}/180</div>
          </div>
          <div class="form-group">
            <label>全站分享缩略图 <FieldHint text="【作用】搜索卡片/微信分享配图\n【规范】16:9，1200x675，png/jpg/webp，<=50MB" /></label>
            <ImageUploadField v-model="global.seo_share_img" />
          </div>
          <button class="btn btn-primary" @click="saveGlobal">保存全站SEO</button>
        </template>

        <template v-if="tab === 'page'">
          <div class="form-group">
            <label>选择栏目</label>
            <select v-model="activePageId" class="form-control">
              <option v-for="p in pages" :key="p.id" :value="p.id">{{ p.title }}</option>
            </select>
          </div>
          <div v-if="activePage">
            <div class="form-group"><label>栏目页面标题 <FieldHint text="【作用】栏目页标题\n【规范】20-30字" /></label><input v-model="activePage.page_title" class="form-control" /></div>
            <div class="form-group"><label>栏目独立关键词 <FieldHint text="【作用】栏目关键词\n【规范】8-15个词，逗号分隔" /></label><textarea v-model="activePage.page_keywords" rows="3" class="form-control" /></div>
            <div class="form-group"><label>栏目独立描述 <FieldHint text="【作用】栏目摘要\n【规范】120-180字" /></label><textarea v-model="activePage.page_desc" rows="4" class="form-control" /></div>
            <div class="form-group">
              <label>栏目分享配图 <FieldHint text="【作用】栏目分享配图\n【规范】16:9，1200x675，<=50MB" /></label>
              <ImageUploadField v-model="activePage.page_seo_img" />
            </div>
            <button class="btn btn-primary" @click="savePage">保存栏目SEO</button>
          </div>
        </template>

        <template v-if="tab === 'item'">
          <div class="tabs-row">
            <button class="tab-btn" :class="{ active: itemTab === 'product' }" @click="itemTab = 'product'; loadProducts(1)">产品SEO</button>
            <button class="tab-btn" :class="{ active: itemTab === 'news' }" @click="itemTab = 'news'; loadNews(1)">资讯SEO</button>
          </div>
          <div class="toolbar">
            <input v-model="keyword" class="form-control" style="max-width:220px" placeholder="名称/ID检索" @keyup.enter="reloadItemList(1)" />
            <select v-model.number="pageSize" class="form-control" style="max-width:110px" @change="reloadItemList(1)">
              <option :value="10">10条/页</option>
              <option :value="20">20条/页</option>
              <option :value="50">50条/页</option>
            </select>
            <button class="btn btn-secondary" @click="reloadItemList(1)">搜索</button>
          </div>
          <div class="table-wrap">
            <table class="data-table">
              <thead><tr><th>ID</th><th>名称</th><th>操作</th></tr></thead>
              <tbody>
                <tr v-for="row in itemRows" :key="row.id">
                  <td>{{ row.id }}</td>
                  <td>{{ row.name || row.title }}</td>
                  <td><button class="btn btn-secondary btn-sm" @click="openItemDialog(row)">编辑SEO</button></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="pagination" v-if="itemPagination.total > 0">
            <button class="btn btn-secondary btn-sm" :disabled="itemPage <= 1" @click="reloadItemList(1)">首页</button>
            <button class="btn btn-secondary btn-sm" :disabled="itemPage <= 1" @click="reloadItemList(itemPage - 1)">上一页</button>
            <span>第 {{ itemPage }} / {{ itemPagination.totalPages }} 页，共 {{ itemPagination.total }} 条</span>
            <button class="btn btn-secondary btn-sm" :disabled="itemPage >= itemPagination.totalPages" @click="reloadItemList(itemPage + 1)">下一页</button>
            <button class="btn btn-secondary btn-sm" :disabled="itemPage >= itemPagination.totalPages" @click="reloadItemList(itemPagination.totalPages)">末页</button>
          </div>
        </template>
      </div>

      <div class="card preview-card">
        <h3 style="margin-bottom: 8px">实时SEO预览</h3>
        <div class="search-title">{{ preview.title || '标题预览' }}</div>
        <img v-if="preview.image" :src="toPublicMediaUrl(preview.image)" class="preview-img" />
        <div class="search-desc">{{ preview.description || '描述预览' }}</div>
        <div class="search-keywords">{{ preview.keywords || '关键词预览' }}</div>
      </div>
    </div>

    <div v-if="showItemDialog" class="modal-overlay" @click.self="showItemDialog = false">
      <div class="modal">
        <div class="modal-header">
          <h3>编辑SEO</h3>
          <button class="modal-close" @click="showItemDialog = false">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group"><label>SEO标题 <FieldHint text="【作用】搜索结果标题\n【规范】20-30字" /></label><input v-model="itemForm.seo_title" class="form-control" /></div>
          <div class="form-group"><label>SEO关键词 <FieldHint text="【作用】匹配关键词\n【规范】8-15个词" /></label><textarea v-model="itemForm.seo_keywords" rows="3" class="form-control" /></div>
          <div class="form-group"><label>SEO描述 <FieldHint text="【作用】搜索摘要\n【规范】120-180字" /></label><textarea v-model="itemForm.seo_desc" rows="4" class="form-control" /></div>
          <div class="form-group">
            <label>SEO配图 <FieldHint text="【作用】分享缩略图\n【规范】16:9，<=50MB" /></label>
            <ImageUploadField v-model="itemForm.seo_img" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showItemDialog = false">取消</button>
          <button class="btn btn-primary" @click="saveItem">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import FieldHint from '@/components/FieldHint.vue'
import {
  getSeoGlobal, saveSeoGlobal,
  getSeoPages, saveSeoPage,
  getSeoProducts, saveSeoProduct,
  getSeoNews, saveSeoNews,
} from '@/api'
import { toPublicMediaUrl } from '@/utils/media'
import ImageUploadField from '@/components/ImageUploadField.vue'

const tab = ref('global')
const itemTab = ref('product')
const global = ref({ seo_home_title: '', seo_global_keywords: '', seo_global_description: '', seo_share_img: '' })
const pages = ref([])
const activePageId = ref(null)
const keyword = ref('')
const pageSize = ref(20)
const itemPage = ref(1)
const itemRows = ref([])
const itemPagination = ref({ total: 0, totalPages: 1 })
const showItemDialog = ref(false)
const editingItem = ref(null)
const itemForm = ref({ seo_title: '', seo_keywords: '', seo_desc: '', seo_img: '' })

const activePage = computed(() => pages.value.find((p) => p.id === activePageId.value) || null)
const preview = computed(() => {
  if (tab.value === 'global') {
    return {
      title: global.value.seo_home_title,
      description: global.value.seo_global_description,
      keywords: global.value.seo_global_keywords,
      image: global.value.seo_share_img,
    }
  }
  if (tab.value === 'page' && activePage.value) {
    return {
      title: activePage.value.page_title || global.value.seo_home_title,
      description: activePage.value.page_desc || global.value.seo_global_description,
      keywords: activePage.value.page_keywords || global.value.seo_global_keywords,
      image: activePage.value.page_seo_img || global.value.seo_share_img,
    }
  }
  return {
    title: itemForm.value.seo_title,
    description: itemForm.value.seo_desc,
    keywords: itemForm.value.seo_keywords,
    image: itemForm.value.seo_img,
  }
})

function count(v) {
  return String(v || '').length
}

async function loadGlobal() {
  global.value = await getSeoGlobal()
}

async function loadPages() {
  pages.value = await getSeoPages()
  if (!activePageId.value && pages.value.length) activePageId.value = pages.value[0].id
}

async function loadProducts(page = 1) {
  itemPage.value = page
  const data = await getSeoProducts({ page, pageSize: pageSize.value, keyword: keyword.value })
  itemRows.value = data.list || []
  itemPagination.value = data.pagination || { total: 0, totalPages: 1 }
}

async function loadNews(page = 1) {
  itemPage.value = page
  const data = await getSeoNews({ page, pageSize: pageSize.value, keyword: keyword.value })
  itemRows.value = data.list || []
  itemPagination.value = data.pagination || { total: 0, totalPages: 1 }
}

function reloadItemList(page = 1) {
  if (itemTab.value === 'product') return loadProducts(page)
  return loadNews(page)
}

async function saveGlobal() {
  if (count(global.value.seo_home_title) > 30) return alert('首页标题不能超过30字')
  if (count(global.value.seo_global_description) > 180) return alert('全站描述不能超过180字')
  await saveSeoGlobal(global.value)
  alert('保存成功')
}

async function savePage() {
  if (!activePage.value) return
  if (count(activePage.value.page_title) > 30) return alert('栏目标题不能超过30字')
  if (count(activePage.value.page_desc) > 180) return alert('栏目描述不能超过180字')
  await saveSeoPage(activePage.value.id, activePage.value)
  alert('保存成功')
}

function openItemDialog(row) {
  editingItem.value = row
  itemForm.value = {
    seo_title: row.seo_title || '',
    seo_keywords: row.seo_keywords || '',
    seo_desc: row.seo_desc || '',
    seo_img: row.seo_img || '',
  }
  showItemDialog.value = true
}

async function saveItem() {
  if (!editingItem.value) return
  if (itemTab.value === 'product') await saveSeoProduct(editingItem.value.id, itemForm.value)
  else await saveSeoNews(editingItem.value.id, itemForm.value)
  showItemDialog.value = false
  await reloadItemList(itemPage.value)
}

function openSourceCheck() {
  window.open('http://localhost:5173', '_blank')
}

watch(activePageId, () => {}, { immediate: false })

onMounted(async () => {
  await loadGlobal()
  await loadPages()
  await loadProducts(1)
})
</script>

<style scoped>
.seo-layout { display: grid; grid-template-columns: 1fr 340px; gap: 16px; align-items: start; }
.tabs-row { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
.tab-btn { border: 1px solid #cbd5e1; background: #fff; border-radius: 8px; padding: 7px 12px; color: #334155; cursor: pointer; }
.tab-btn.active { border-color: #2563eb; background: #eff6ff; color: #1d4ed8; }
.upload-box { border: 1px dashed #cbd5e1; border-radius: 8px; padding: 10px; }
.preview { margin-top: 8px; max-width: 120px; border-radius: 6px; display: block; }
.preview-card { position: sticky; top: 80px; }
.search-title { color: #1d4ed8; font-size: 18px; margin-bottom: 6px; }
.preview-img { width: 100%; border-radius: 8px; margin: 8px 0; }
.search-desc { color: #6b7280; font-size: 13px; line-height: 1.5; margin-bottom: 8px; }
.search-keywords { color: #16a34a; font-size: 12px; }
.counter { margin-top: 4px; font-size: 12px; color: #64748b; text-align: right; }
@media (max-width: 1100px) { .seo-layout { grid-template-columns: 1fr; } .preview-card { position: static; } }
</style>
