import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as loginApi, getProfile } from '@/api'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('admin_token') || '')
  const admin = ref(JSON.parse(localStorage.getItem('admin_info') || 'null'))

  const isLoggedIn = computed(() => !!token.value)

  function setAuth(newToken, adminInfo) {
    token.value = newToken
    admin.value = adminInfo
    localStorage.setItem('admin_token', newToken)
    localStorage.setItem('admin_info', JSON.stringify(adminInfo))
  }

  function logout() {
    token.value = ''
    admin.value = null
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_info')
  }

  async function login(username, password) {
    const data = await loginApi({ username, password })
    setAuth(data.token, data.admin)
    return data
  }

  async function fetchProfile() {
    const data = await getProfile()
    admin.value = data
    localStorage.setItem('admin_info', JSON.stringify(data))
    return data
  }

  return { token, admin, isLoggedIn, login, logout, fetchProfile, setAuth }
})
