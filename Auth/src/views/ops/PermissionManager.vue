<template>
  <div>
    <div class="page-header">
      <div>
        <h2>权限管理</h2>
        <p class="desc">绑定账号手机号和邮箱，并安全修改登录密码</p>
      </div>
    </div>

    <div class="card">
      <div class="form-group">
        <label>登录账号</label>
        <input class="form-control" :value="profile.username || '-'" disabled />
      </div>
      <div class="form-group">
        <label>姓名</label>
        <input class="form-control" :value="profile.real_name || '-'" disabled />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>绑定邮箱 *</label>
          <input v-model="bindForm.email" class="form-control" placeholder="请输入常用邮箱" />
        </div>
        <div class="form-group">
          <label>绑定手机号 *</label>
          <input v-model="bindForm.phone" class="form-control" placeholder="请输入手机号" />
        </div>
      </div>
      <div class="save-bar-inline">
        <button class="btn btn-primary" :disabled="savingBind" @click="saveBinding">{{ savingBind ? '保存中...' : '保存绑定信息' }}</button>
      </div>
    </div>

    <div class="card" style="margin-top: 16px">
      <div class="form-row">
        <div class="form-group">
          <label>原密码 *</label>
          <input v-model="pwdForm.oldPassword" type="password" class="form-control" />
        </div>
        <div class="form-group">
          <label>新密码 *</label>
          <input v-model="pwdForm.newPassword" type="password" class="form-control" placeholder="至少6位" />
        </div>
      </div>
      <div class="form-group">
        <label>确认新密码 *</label>
        <input v-model="pwdForm.confirmPassword" type="password" class="form-control" />
      </div>
      <div class="save-bar-inline">
        <button class="btn btn-primary" :disabled="savingPwd" @click="changePwd">{{ savingPwd ? '修改中...' : '修改密码' }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { getProfile, updateProfileBinding, changePassword } from '@/api'

const auth = useAuthStore()
const profile = ref({})
const savingBind = ref(false)
const savingPwd = ref(false)
const bindForm = ref({ email: '', phone: '' })
const pwdForm = ref({ oldPassword: '', newPassword: '', confirmPassword: '' })

async function loadProfile() {
  const data = await getProfile()
  profile.value = data || {}
  bindForm.value.email = data?.email || ''
  bindForm.value.phone = data?.phone || ''
}

function validEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || '').trim())
}

function validPhone(v) {
  return /^1\d{10}$/.test(String(v || '').trim())
}

async function saveBinding() {
  if (!validEmail(bindForm.value.email)) return alert('请输入正确邮箱')
  if (!validPhone(bindForm.value.phone)) return alert('请输入正确手机号')
  savingBind.value = true
  try {
    await updateProfileBinding({ email: bindForm.value.email.trim(), phone: bindForm.value.phone.trim() })
    await loadProfile()
    await auth.fetchProfile()
    alert('绑定信息已保存')
  } catch (e) {
    alert(e.message)
  } finally {
    savingBind.value = false
  }
}

async function changePwd() {
  if (!pwdForm.value.oldPassword) return alert('请填写原密码')
  if ((pwdForm.value.newPassword || '').length < 6) return alert('新密码至少6位')
  if (pwdForm.value.newPassword !== pwdForm.value.confirmPassword) return alert('两次新密码不一致')
  if (!profile.value.email || !profile.value.phone) return alert('请先绑定邮箱和手机号，再修改密码')
  savingPwd.value = true
  try {
    await changePassword({ oldPassword: pwdForm.value.oldPassword, newPassword: pwdForm.value.newPassword })
    pwdForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' }
    alert('密码修改成功')
  } catch (e) {
    alert(e.message)
  } finally {
    savingPwd.value = false
  }
}

onMounted(loadProfile)
</script>
