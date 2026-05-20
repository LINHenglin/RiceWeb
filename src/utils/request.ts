import type { AxiosInstance, AxiosRequestConfig } from 'axios'
import axios from 'axios'
import { ElMessage } from 'element-plus'

/**
 * 开发环境默认走 Vite 代理：VITE_API_BASE_URL=/api
 * 生产环境可配置为后端完整地址（如 http://localhost:8080）或同域反向代理前缀。
 */
const BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '/api'

const service: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 60000 // 增加超时时间到60秒
})

// 标记是否正在处理 401，防止循环调用
let is401Handling = false

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    // 动态获取 token，避免循环导入
    const token = localStorage.getItem('token')
    
    if (token) {
      // 检查token是否已经包含Bearer前缀
      if (token.startsWith('Bearer ')) {
        config.headers.Authorization = token
      } else {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  (response) => {
    const data = response.data
    console.log('[API Response]', data)
    
    // 假设后端返回格式：{ code, message, data }
    // code "0" 表示错误，"200" 或 "1" 表示成功
    const code = String(data.code)
    if (code === '200' || code === '1' || data.success === true) {
      console.log('[API Success]', data)
      // 统一返回格式：{ success: true, data: data.data || data }
      return {
        success: true,
        data: data.data || data
      }
    } else {
      console.error('[API Error]', data.message)
      // 不要在拦截器中弹窗，让调用方处理
      return Promise.reject(new Error(data.message || '请求失败'))
    }
  },
  (error) => {
    console.error('[Request Error]', error.message, error.response?.status)
    
    // 检查是否是调用logout接口时的401错误
    const isLogoutRequest = error.config?.url?.includes('/user/user/logout')
    
    // 处理 401 未授权错误（排除logout接口）
    if (error.response?.status === 401 && !is401Handling && !isLogoutRequest) {
      is401Handling = true
      
      console.warn('[401 Error] 未授权，正在处理', error.response?.data)
      
      // 清除 token
      localStorage.removeItem('token')
      
      // 尝试获取具体的错误信息
      let errorMessage = '登录已过期，请重新登录'
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error
      }
      
      // 显示错误信息
      ElMessage.error(errorMessage)
      
      // 修改错误对象的 message 字段，使其包含服务器返回的具体错误信息
      error.message = errorMessage
      
      // 重置标记
      setTimeout(() => {
        is401Handling = false
      }, 1500)
    }
    
    return Promise.reject(error)
  }
)

export const request = (config: AxiosRequestConfig) => {
  return service(config)
}

export const uploadFile = (url: string, file: File, fieldName: string = 'file') => {
  const formData = new FormData()
  formData.append(fieldName, file)
  
  return request({
    url,
    method: 'POST',
    data: formData
  })
}
