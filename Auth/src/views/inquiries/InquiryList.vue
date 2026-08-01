<template>
  <div>
    <div class="page-header">
      <div>
        <h2>询价管理</h2>
        <p class="desc">查看和处理用户提交的询价信息</p>
      </div>
      <div class="toolbar">
        <button class="btn btn-secondary" @click="downloadExport">导出Excel/PDF数据</button>
      </div>
    </div>

    <div class="card email-card">
      <div class="email-card-head">
        <div>
          <h3>询价接收邮箱</h3>
          <p class="desc">新询价将通过 SMTP 发信通知到以下邮箱，最多 10 个</p>
        </div>
        <button class="btn btn-primary btn-sm" :disabled="emailSaving || emailList.length >= 10" @click="addEmailRow">
          添加邮箱
        </button>
      </div>
      <div v-if="emailLoading" class="empty-state">加载中...</div>
      <div v-else class="email-list">
        <div v-for="(email, idx) in emailList" :key="idx" class="email-row">
          <input
            v-model="emailList[idx]"
            class="form-control"
            type="email"
            placeholder="name@example.com"
          />
          <button class="btn btn-danger btn-sm" @click="removeEmailRow(idx)">删除</button>
        </div>
        <div v-if="!emailList.length" class="hint">暂未配置接收邮箱，用户提交询价后不会发送邮件通知</div>
        <div class="email-actions">
          <button class="btn btn-primary" :disabled="emailSaving" @click="saveEmails">
            {{ emailSaving ? '保存中...' : '保存接收邮箱' }}
          </button>
        </div>
      </div>
    </div>

    <div class="toolbar">
      <select v-model="filterStatus" class="form-control" style="max-width:140px" @change="loadData(1)">
        <option value="">全部状态</option>
        <option value="0">未处理</option>
        <option value="1">已处理</option>
        <option value="2">已跟进</option>
        <option value="3">已完成</option>
      </select>
      <input v-model="search.name" class="form-control" style="max-width:160px" placeholder="联系人姓名" @keyup.enter="loadData(1)" />
      <input v-model="search.phone" class="form-control" style="max-width:160px" placeholder="联系电话" @keyup.enter="loadData(1)" />
      <input v-model="search.email" class="form-control" style="max-width:180px" placeholder="邮箱" @keyup.enter="loadData(1)" />
      <input v-model="search.company" class="form-control" style="max-width:180px" placeholder="所属公司" @keyup.enter="loadData(1)" />
      <input v-model="search.productKeyword" class="form-control" style="max-width:220px" placeholder="咨询产品名称/产品ID" @keyup.enter="loadData(1)" />
      <button class="btn btn-secondary" @click="loadData(1)">搜索</button>
      <button class="btn btn-secondary" @click="resetSearch">清空</button>
    </div>

    <div class="card">
      <div v-if="loading" class="empty-state">加载中...</div>
      <div v-else-if="!list.length" class="empty-state">暂无询价记录</div>
      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th><th>联系人</th><th>电话</th><th>公司</th><th>咨询产品</th><th>状态</th><th>提交时间</th><th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in list" :key="item.id">
              <td>{{ item.id }}</td>
              <td>{{ item.name }}</td>
              <td>{{ item.phone }}</td>
              <td>{{ item.company || '-' }}</td>
              <td>{{ item.product_name || '-' }}</td>
              <td><span :class="['tag', INQUIRY_STATUS[item.status]?.class]">{{ INQUIRY_STATUS[item.status]?.label }}</span></td>
              <td>{{ formatDate(item.submit_time) }}</td>
              <td class="actions">
                <button class="btn btn-secondary btn-sm" @click="openDetail(item)">查看</button>
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

    <div v-if="showDetail" class="modal-overlay" @click.self="showDetail = false">
      <div class="modal modal-lg">
        <div class="modal-header">
          <h3>询价详情 #{{ detail.id }}</h3>
          <button class="modal-close" @click="showDetail = false">&times;</button>
        </div>
        <div class="modal-body">
          <div class="detail-grid">
            <div class="detail-item"><label>联系人</label><span>{{ detail.name }}</span></div>
            <div class="detail-item"><label>电话</label><span>{{ detail.phone }}</span></div>
            <div class="detail-item"><label>邮箱</label><span>{{ detail.email || '-' }}</span></div>
            <div class="detail-item"><label>公司</label><span>{{ detail.company || '-' }}</span></div>
            <div class="detail-item"><label>咨询产品</label><span>{{ detail.product_name || '-' }}</span></div>
            <div class="detail-item"><label>提交时间</label><span>{{ formatDate(detail.submit_time) }}</span></div>
          </div>
          <div class="form-group" style="margin-top:16px">
            <label>需求描述</label>
            <div class="detail-content">{{ detail.demand }}</div>
          </div>
          <hr style="margin:20px 0;border:none;border-top:1px solid var(--color-border)" />
          <div v-if="formError" class="alert alert-error">{{ formError }}</div>
          <div class="form-row">
            <div class="form-group">
              <label>处理状态</label>
              <select v-model="handleForm.status" class="form-control">
                <option :value="0">未处理</option>
                <option :value="1">已处理</option>
                <option :value="2">已跟进</option>
                <option :value="3">已完成</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>处理备注</label>
            <textarea v-model="handleForm.handle_note" class="form-control" rows="3" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showDetail = false">关闭</button>
          <button class="btn btn-primary" :disabled="saving" @click="handleSave">{{ saving ? '保存中...' : '保存处理结果' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import {
  getInquiryList,
  getInquiryById,
  handleInquiry,
  deleteInquiry,
  exportInquiries,
  getInquiryNotifyEmails,
  saveInquiryNotifyEmails,
} from '@/api'
import { confirmAction, INQUIRY_STATUS } from '@/utils/helpers'

const loading = ref(false)
const saving = ref(false)
const showDetail = ref(false)
const formError = ref('')
const list = ref([])
const detail = ref({})
const filterStatus = ref('')
const page = ref(1)
const pagination = ref({ total: 0, totalPages: 1 })
const pageSize = ref(20)
const jumpPage = ref(1)
const search = ref({ name: '', phone: '', email: '', company: '', productKeyword: '' })
const handleForm = ref({ status: 0, handle_note: '' })

const emailLoading = ref(false)
const emailSaving = ref(false)
const emailList = ref([])

function formatDate(d) { return d ? new Date(d).toLocaleString('zh-CN') : '-' }

async function loadEmails() {
  emailLoading.value = true
  try {
    const data = await getInquiryNotifyEmails()
    emailList.value = Array.isArray(data?.emails) ? [...data.emails] : []
  } catch (e) {
    alert(e.message)
  } finally {
    emailLoading.value = false
  }
}

function addEmailRow() {
  if (emailList.value.length >= 10) {
    alert('最多添加 10 个邮箱')
    return
  }
  emailList.value.push('')
}

function removeEmailRow(idx) {
  emailList.value.splice(idx, 1)
}

async function saveEmails() {
  const cleaned = emailList.value.map((e) => String(e || '').trim()).filter(Boolean)
  if (cleaned.length > 10) {
    alert('最多添加 10 个邮箱')
    return
  }
  emailSaving.value = true
  try {
    const data = await saveInquiryNotifyEmails({ emails: cleaned })
    emailList.value = Array.isArray(data?.emails) ? [...data.emails] : cleaned
    alert('接收邮箱已保存')
  } catch (e) {
    alert(e.message)
  } finally {
    emailSaving.value = false
  }
}

async function loadData(p = page.value) {
  loading.value = true
  page.value = p
  try {
    const params = { page: p, pageSize: pageSize.value }
    if (filterStatus.value !== '') params.status = filterStatus.value
    if (search.value.name) params.name = search.value.name
    if (search.value.phone) params.phone = search.value.phone
    if (search.value.email) params.email = search.value.email
    if (search.value.company) params.company = search.value.company
    if (search.value.productKeyword) params.productKeyword = search.value.productKeyword
    const data = await getInquiryList(params)
    list.value = data.list
    pagination.value = data.pagination
  } catch (e) { alert(e.message) }
  finally { loading.value = false }
}

function resetSearch() {
  search.value = { name: '', phone: '', email: '', company: '', productKeyword: '' }
  loadData(1)
}

function goJump() {
  const t = Number(jumpPage.value || 1)
  const safe = Math.min(Math.max(t, 1), pagination.value.totalPages || 1)
  loadData(safe)
}

async function openDetail(item) {
  try {
    detail.value = await getInquiryById(item.id)
    handleForm.value = { status: detail.value.status, handle_note: detail.value.handle_note || '' }
    formError.value = ''
    showDetail.value = true
  } catch (e) { alert(e.message) }
}

async function handleSave() {
  saving.value = true
  formError.value = ''
  try {
    await handleInquiry(detail.value.id, handleForm.value)
    showDetail.value = false
    await loadData()
  } catch (e) { formError.value = e.message }
  finally { saving.value = false }
}

async function handleDelete(item) {
  if (!confirmAction(`确定删除询价记录 #${item.id} 吗？`)) return
  try { await deleteInquiry(item.id); await loadData() }
  catch (e) { alert(e.message) }
}

async function downloadExport() {
  try {
    const rows = await exportInquiries({ ids: [] })
    const headers = Object.keys(rows[0] || {})
    const csvRows = [headers.join(',')]
    rows.forEach((r) => {
      csvRows.push(headers.map((h) => `"${String(r[h] || '').replace(/"/g, '""')}"`).join(','))
    })
    const blob = new Blob([`\uFEFF${csvRows.join('\n')}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `询价导出_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  } catch (e) {
    alert(e.message)
  }
}

onMounted(() => {
  loadEmails()
  loadData()
})
</script>

<style scoped>
.email-card {
  margin-bottom: 16px;
}
.email-card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}
.email-card-head h3 {
  margin: 0 0 4px;
  font-size: 16px;
}
.email-card-head .desc {
  margin: 0;
  font-size: 13px;
  color: var(--color-text-light, #64748b);
}
.email-list {
  display: grid;
  gap: 10px;
}
.email-row {
  display: flex;
  gap: 8px;
  align-items: center;
}
.email-actions {
  margin-top: 4px;
}
.hint {
  font-size: 13px;
  color: #64748b;
}
.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.detail-item label {
  display: block;
  font-size: 12px;
  color: var(--color-text-light);
  margin-bottom: 2px;
}
.detail-item span { font-weight: 500; }
.detail-content {
  background: var(--color-bg);
  padding: 12px;
  border-radius: 6px;
  white-space: pre-wrap;
  line-height: 1.6;
}
</style>
