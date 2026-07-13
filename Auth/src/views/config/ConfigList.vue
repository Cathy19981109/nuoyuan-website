<template>
  <div>
    <div class="page-header">
      <div>
        <h2>系统配置</h2>
        <p class="desc">管理网站基本信息、联系方式及询价邮件设置</p>
      </div>
    </div>

    <div class="card">
      <div v-if="loading" class="empty-state">加载中...</div>
      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr><th>配置项</th><th>键名</th><th>配置值</th><th>说明</th><th>操作</th></tr>
          </thead>
          <tbody>
            <tr v-for="item in list" :key="item.id">
              <td>{{ item.name }}</td>
              <td><code class="key-code">{{ item.config_key }}</code></td>
              <td class="value-cell">
                <input
                  v-if="editingId === item.id"
                  v-model="editValue"
                  class="form-control"
                  :type="isPasswordKey(item.config_key) ? 'password' : 'text'"
                />
                <span v-else>{{ maskValue(item) }}</span>
              </td>
              <td class="desc-cell">{{ item.description || '-' }}</td>
              <td class="actions">
                <template v-if="editingId === item.id">
                  <button class="btn btn-primary btn-sm" :disabled="saving" @click="saveEdit(item)">保存</button>
                  <button class="btn btn-secondary btn-sm" @click="cancelEdit">取消</button>
                </template>
                <button v-else class="btn btn-secondary btn-sm" @click="startEdit(item)">编辑</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="card" style="margin-top:20px">
      <h3 class="section-title">邮件配置说明</h3>
      <ul class="tips-list">
        <li><strong>inquiry_email</strong>：接收询价通知的邮箱地址</li>
        <li><strong>smtp_host / smtp_port</strong>：邮件服务器地址和端口（如 smtp.qq.com / 465）</li>
        <li><strong>smtp_user / smtp_pass</strong>：发件邮箱账号和授权码</li>
        <li>配置完成后，用户在前台提交询价时会自动发送邮件通知</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getConfigList, updateConfig } from '@/api'

const loading = ref(false)
const saving = ref(false)
const list = ref([])
const editingId = ref(null)
const editValue = ref('')

const passwordKeys = ['smtp_pass']

function isPasswordKey(key) { return passwordKeys.includes(key) }

function maskValue(item) {
  if (isPasswordKey(item.config_key) && item.config_value) return '******'
  return item.config_value || '-'
}

function startEdit(item) {
  editingId.value = item.id
  editValue.value = item.config_value || ''
}

function cancelEdit() {
  editingId.value = null
  editValue.value = ''
}

async function saveEdit(item) {
  saving.value = true
  try {
    await updateConfig(item.id, { config_value: editValue.value })
    item.config_value = editValue.value
    cancelEdit()
  } catch (e) {
    alert(e.message)
  } finally {
    saving.value = false
  }
}

async function loadData() {
  loading.value = true
  try { list.value = await getConfigList() }
  catch (e) { alert(e.message) }
  finally { loading.value = false }
}

onMounted(loadData)
</script>

<style scoped>
.key-code {
  background: var(--color-bg);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}
.value-cell { max-width: 280px; }
.desc-cell { color: var(--color-text-light); font-size: 13px; max-width: 200px; }
.section-title { font-size: 15px; font-weight: 600; margin-bottom: 12px; color: var(--color-primary); }
.tips-list { padding-left: 20px; color: var(--color-text-light); font-size: 13px; line-height: 2; }
</style>
