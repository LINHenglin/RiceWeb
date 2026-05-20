import { request, uploadFile } from './request'

export const userApi = {
  login: (data: any) => request({
    url: '/user/user/login',
    method: 'POST',
    data
  }),
  
  register: (data: any) => request({
    url: '/user/user/register',
    method: 'POST',
    data
  }),
  
  getUserInfo: () => request({
    url: '/user/user/getUserInfo',
    method: 'GET'
  }),
  
  updateUser: (data: any) => request({
    url: '/user/user/updateUser',
    method: 'POST',
    data
  }),
  
  logout: () => request({
    url: '/user/user/logout',
    method: 'POST'
  }),
  
  uploadImage: (file: File) => uploadFile('/common/file/upload/image', file, 'image')
}

export const aiApi = {
  classify: (file: File) => uploadFile('/user/ai/classify', file),
  
  segment: (file: File) => uploadFile('/user/ai/segment', file),
  
  diagnosis: (file: File, riceVariety: string, symptomDesc: string) => {
    const formData = new FormData()
    formData.append('file', file)
    
    if (riceVariety) {
      formData.append('riceVariety', riceVariety)
    }
    
    if (symptomDesc) {
      formData.append('symptomDesc', symptomDesc)
    }
    
    return request({
      url: '/user/ai/diagnosis',
      method: 'POST',
      data: formData
    })
  },
  
  getDetectionRecords: (data: any) => request({
    url: '/user/ai/detectionRecodePageQuery',
    method: 'POST',
    data
  }),
  
  getDetectionRecordDetail: (id: string) => request({
    url: `/user/ai/detectionRecodeDetail/${id}`,
    method: 'GET'
  }),
  
  chat: (memoryId: string, question: string) => request({
    url: '/user/ai/chat',
    method: 'POST',
    data: {
      memoryId,
      question
    },
    headers: {
      'Content-Type': 'application/json'
    }
  }),
  
  // 流式聊天接口
  chatStream: (memoryId: string, question: string, onMessage: (chunk: string) => void, onComplete: () => void, onError: (error: Error) => void) => {
    const token = localStorage.getItem('token')
    const baseURL = (import.meta as any).env?.VITE_API_BASE_URL || '/api'
    const url = `${baseURL}/user/ai/chat/stream`
    
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token || ''
      },
      body: JSON.stringify({ memoryId, question })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('Response body is not readable')
      }
      
      const decoder = new TextDecoder()
      let buffer = ''
      
      function readStream(): Promise<void> {
        return reader.read().then(({ done, value }) => {
          if (done) {
            onComplete()
            return
          }
          
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''
          
          for (const line of lines) {
            if (line.startsWith('data:')) {
              const data = line.slice(5).trim()
              if (data === '[DONE]') {
                onComplete()
                return
              }
              try {
                const parsed = JSON.parse(data)
                if (parsed.content) {
                  onMessage(parsed.content)
                } else if (parsed.error) {
                  onError(new Error(parsed.error))
                }
              } catch (e) {
                console.error('[Stream Parse Error]', e)
              }
            }
          }
          
          return readStream()
        })
      }
      
      return readStream()
    })
    .catch(error => {
      console.error('[Stream Error]', error)
      onError(error)
    })
  },
  
  chatRecodePageQuery: (params: any) => request({
    url: '/user/ai/chatRecodePageQuery',
    method: 'POST',
    data: params
  }),
  
  chatRecodeDetail: (memoryId: string) => request({
    url: `/user/ai/chatRecodeDetail/${memoryId}`,
    method: 'GET'
  }),
  
  // 删除聊天记录
  deleteChat: (memoryId: string) => request({
    url: '/user/ai/chatRecodeDelete',
    method: 'POST',
    data: {
      memoryId
    }
  }),
  
  // 删除诊断记录
  deleteDetectionRecord: (id: number) => request({
    url: '/user/ai/detectionRecodeDelete',
    method: 'POST',
    data: {
      detectionRecordId: id
    }
  })
}

/** 管理端接口（需登录且用户 role 为 admin） */
export const adminApi = {
  /** 仪表盘汇总数据 */
  getStats: () =>
    request({
      url: '/admin/stats',
      method: 'GET'
    }),

  /** 用户分页列表 */
  getUserPage: (data: { page: number; pageSize: number; keyword?: string }) =>
    request({
      url: '/admin/user/pageQuery',
      method: 'POST',
      data
    }),

  /** 启用/禁用用户 */
  setUserStatus: (data: { userId: number; disabled: boolean }) =>
    request({
      url: '/admin/user/status',
      method: 'POST',
      data
    }),

  /** 删除用户（不可删管理员；级联删除检测记录与聊天会话） */
  deleteUser: (data: { userId: number }) =>
    request({
      url: '/admin/user/delete',
      method: 'POST',
      data
    }),

  /** 重置用户密码为默认 123456（不可重置管理员） */
  resetPassword: (data: { userId: number }) =>
    request({
      url: '/admin/user/resetPassword',
      method: 'POST',
      data
    })
}
