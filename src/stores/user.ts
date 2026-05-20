import { ElMessage } from 'element-plus'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { userApi } from '../utils/api'

export const useUserStore = defineStore('user', () => {
  const token = ref<string>(localStorage.getItem('token') || '')
  const userInfo = ref<any>(null)
  const isLoggedIn = ref<boolean>(!!token.value)
  /** 后端在 getUserInfo 中返回 role === 'admin' 时可用管理后台 */
  const isAdmin = computed(() => userInfo.value?.role === 'admin')

  const login = async (credentials: { username: string; password: string }) => {
    try {
      console.log('[Login] 开始登录，用户名:', credentials.username)
      const response = await userApi.login(credentials)
      console.log('[Login] 登录响应:', response)
      
      // 从响应中获取 token，支持多种格式
      let tokenValue = response.data
      // 如果data是对象，尝试从data.token获取
      if (typeof tokenValue === 'object' && tokenValue !== null) {
        tokenValue = tokenValue.token || tokenValue.Token || tokenValue.access_token
      }
      console.log('[Login] 获取到的 token:', tokenValue)
      
      if (!tokenValue) {
        throw new Error('未获取到 token')
      }
      
      token.value = tokenValue
      isLoggedIn.value = true
      localStorage.setItem('token', token.value)
      console.log('[Login] token 已保存，登录状态已更新')
      
      // 后续页面加载时再获取完整用户信息
      console.log('[Login] 登录完成')
      
      return { success: true }
    } catch (error: any) {
      console.error('[Login] 登录失败:', error.message)
      // 错误已经在 request 拦截器中处理，这里不需要再次弹窗
      // 只有在未获取到 token 的情况下才需要显示错误信息
      if (error.message === '未获取到 token') {
        ElMessage.error('服务器返回数据格式错误')
      }
      return { success: false, message: error.message }
    }
  }

  const register = async (data: { username: string; password: string; email: string }) => {
    try {
      console.log('[Register] 开始注册，用户名:', data.username)
      const response = await userApi.register({
        username: data.username,
        password: data.password,
        email: data.email
      })
      console.log('[Register] 注册响应:', response)
      ElMessage.success('注册成功，请登录')
      return { success: true }
    } catch (error: any) {
      console.error('[Register] 注册失败:', error.message)
      ElMessage.error(error.message || '注册失败')
      return { success: false, message: error.message }
    }
  }

  const getUserInfo = async () => {
    try {
      const response = await userApi.getUserInfo()
      userInfo.value = response.data || response
      return response
    } catch (error: any) {
      console.error('获取用户信息失败', error)
      return null
    }
  }

  const updateUser = async (data: any) => {
    try {
      await userApi.updateUser(data)
      await getUserInfo()
      ElMessage.success('更新成功')
      return { success: true }
    } catch (error: any) {
      ElMessage.error('更新失败')
      return { success: false, message: error.message }
    }
  }

  const logout = async () => {
    try {
      // 先调用后端退出接口
      await userApi.logout()
    } catch (error) {
      // 忽略退出接口的错误
    } finally {
      // 清除本地状态
      token.value = ''
      userInfo.value = null
      isLoggedIn.value = false
      localStorage.removeItem('token')
    }
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    isAdmin,
    login,
    register,
    getUserInfo,
    updateUser,
    logout
  }
})
