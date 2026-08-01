<template>
  <div>
    <div class="page-header">
      <div>
        <h2>数据统计</h2>
        <p class="desc">查看日活与热门产品浏览情况</p>
      </div>
      <div class="toolbar">
        <select v-model="quickRange" class="form-control" style="max-width: 180px">
          <option value="1">昨日</option>
          <option value="7">近7天</option>
          <option value="30">近30天</option>
          <option value="custom">自定义</option>
        </select>
        <input v-if="quickRange==='custom'" type="date" v-model="startDate" class="form-control" />
        <input v-if="quickRange==='custom'" type="date" v-model="endDate" class="form-control" />
        <button class="btn btn-secondary" @click="loadData">筛选</button>
        <button class="btn btn-primary" @click="exportExcel">导出Excel</button>
      </div>
    </div>

    <div class="card" style="margin-bottom: 20px">
      <h3 style="margin-bottom: 10px">全站流量（日活）</h3>
      <div v-if="loading" class="empty-state">加载中...</div>
      <div v-else class="table-wrap">
        <table class="data-table">
          <thead><tr><th>日期</th><th>访问次数</th><th>访客人数</th><th>来源（JSON）</th></tr></thead>
          <tbody>
            <tr v-for="row in data.trafficDaily" :key="row.stat_date">
              <td>{{ row.stat_date }}</td>
              <td>{{ row.visit_count }}</td>
              <td>{{ row.visitor_count }}</td>
              <td><code>{{ JSON.stringify(row.source_json || {}) }}</code></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="card">
      <h3 style="margin-bottom: 10px">产品浏览排行</h3>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>产品编码</th><th>产品名称</th><th>浏览量</th></tr></thead>
          <tbody>
            <tr v-for="row in data.hotProducts" :key="row.id">
              <td>{{ row.product_code || '-' }}</td>
              <td>{{ row.name }}</td>
              <td>{{ row.view_count }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { getStatsDashboard } from '@/api'

const loading = ref(false)
const quickRange = ref('7')
const startDate = ref('')
const endDate = ref('')
const data = ref({
  trafficDaily: [],
  hotProducts: [],
})

function toDateText(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getRange() {
  if (quickRange.value === 'custom' && startDate.value && endDate.value) {
    return { startDate: startDate.value, endDate: endDate.value }
  }
  const days = Number(quickRange.value || 7)
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - days)
  return { startDate: toDateText(start), endDate: toDateText(end) }
}

async function loadData() {
  loading.value = true
  try {
    data.value = await getStatsDashboard(getRange())
  } catch (e) {
    alert(e.message)
  } finally {
    loading.value = false
  }
}

loadData()

function exportRowsAsCsv(filename, headers, rows) {
  const content = [headers.join(','), ...rows.map((row) => row.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))].join('\n')
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function exportExcel() {
  const trafficRows = data.value.trafficDaily.map((r) => [r.stat_date, r.visit_count, r.visitor_count])
  const hotRows = data.value.hotProducts.map((r) => [r.product_code || '-', r.name, r.view_count])
  exportRowsAsCsv('数据统计_流量.csv', ['日期', '访问次数', '访客人数'], trafficRows)
  exportRowsAsCsv('数据统计_产品.csv', ['产品编码', '产品名称', '浏览量'], hotRows)
}
</script>
