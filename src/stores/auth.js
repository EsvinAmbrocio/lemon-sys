import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import db from '@/db/db'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(JSON.parse(localStorage.getItem('lemon_user') || 'null'))

  const isAuthenticated = computed(() => !!user.value)
  const role = computed(() => user.value?.role || null)
  const userName = computed(() => user.value?.name || '')

  async function login(email, password) {
    const found = await db.users.where('email').equals(email).first()
    if (!found || found.password !== password || !found.active) {
      throw new Error('Credenciales incorrectas o usuario inactivo')
    }
    user.value = { id: found.id, name: found.name, email: found.email, role: found.role, department: found.department }
    localStorage.setItem('lemon_user', JSON.stringify(user.value))
    return user.value
  }

  function logout() {
    user.value = null
    localStorage.removeItem('lemon_user')
  }

  return { user, isAuthenticated, role, userName, login, logout }
})
