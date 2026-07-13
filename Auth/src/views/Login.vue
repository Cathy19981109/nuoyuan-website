<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-header">
        <div class="logo">N</div>
        <h1>诺元智合</h1>
        <p>管理后台登录</p>
      </div>

      <div v-if="error" class="alert alert-error">{{ error }}</div>

      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label>用户名</label>
          <input v-model="form.username" class="form-control" placeholder="请输入用户名" autocomplete="username" />
        </div>
        <div class="form-group">
          <label>密码</label>
          <input v-model="form.password" type="password" class="form-control" placeholder="请输入密码" autocomplete="current-password" />
        </div>
        <button type="submit" class="btn btn-primary login-btn" :disabled="loading">
          {{ loading ? '登录中...' : '登 录' }}
        </button>
      </form>

      <p class="login-tip">默认账号：admin / 123456</p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const form = reactive({ username: 'admin', password: '123456' })
const loading = ref(false)
const error = ref('')

async function handleLogin() {
  if (!form.username || !form.password) {
    error.value = '请输入用户名和密码'
    return
  }
  loading.value = true
  error.value = ''
  try {
    await auth.login(form.username, form.password)
    router.push(route.query.redirect || '/dashboard')
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-primary) 0%, #061a36 100%);
  padding: 20px;
}

.login-card {
  background: var(--color-white);
  border-radius: 12px;
  padding: 40px 36px;
  width: min(400px, 100%);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.login-header { text-align: center; margin-bottom: 28px; }
.logo {
  width: 56px;
  height: 56px;
  background: var(--color-accent);
  color: #fff;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 700;
  margin: 0 auto 14px;
}
.login-header h1 { font-size: 22px; color: var(--color-primary); margin-bottom: 4px; }
.login-header p { color: var(--color-text-light); font-size: 14px; }

.login-btn { width: 100%; padding: 12px; margin-top: 8px; font-size: 15px; }
.login-tip { text-align: center; margin-top: 20px; font-size: 12px; color: var(--color-text-light); }
</style>
