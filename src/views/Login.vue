<template>
  <div class="login-page">
    <!-- 背景装饰 -->
    <div class="background-decoration"></div>
    <div class="background-decoration bg-2"></div>
    <div class="background-decoration bg-3"></div>
    
    <div class="login-container">
      <!-- 艺术字标题 -->
      <div class="art-title">
        <h1>管理后台</h1>
        <p class="subtitle">水稻病虫害识别小程序</p>
      </div>

      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="auth-form"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            prefix-icon="User"
            size="large"
            clearable
            class="form-input"
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            prefix-icon="Lock"
            size="large"
            clearable
            show-password
            class="form-input"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button
            :loading="loading"
            type="primary"
            size="large"
            class="submit-btn"
            @click="handleLogin"
          >
            登 录
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FormInstance } from 'element-plus'
import { ElMessage } from 'element-plus'
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)
const loginFormRef = ref<FormInstance>()

const loginForm = reactive({
  username: '',
  password: ''
})

const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, message: '用户名至少3个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6个字符', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  await loginFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    loading.value = true
    console.log('[LoginForm] 开始验证表单并登录')
    try {
      console.log('[LoginForm] 调用 userStore.login()')
      const result = await userStore.login({
        username: loginForm.username,
        password: loginForm.password
      })
      console.log('[LoginForm] 登录结果:', result)
      
      if (result.success) {
        await userStore.getUserInfo()
        if (userStore.userInfo?.role === 'admin') {
          ElMessage.success('登录成功')
          router.push('/admin')
        } else {
          await userStore.logout()
          ElMessage.warning('此 Web 端仅供管理员使用，请使用微信小程序登录')
        }
      } else {
        console.warn('[LoginForm] 登录未成功，返回结果:', result)
      }
    } catch (error) {
      // 错误已经在 userStore.login 中处理，这里不需要再次处理
      console.log('[LoginForm] 捕获到错误，但已在 userStore 中处理')
    } finally {
      loading.value = false
    }
  })
}
</script>

<style scoped>
.login-page {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at top left, #e6f9f0 0%, #b2e1e0 40%, #89c9a6 100%);
  position: relative;
  overflow: hidden;
}

.background-decoration {
  position: absolute;
  width: 400px;
  height: 400px;
  background: rgba(255, 255, 255, 0.18);
  border-radius: 50%;
  top: -100px;
  right: -100px;
  animation: float 6s ease-in-out infinite;
}

.background-decoration.bg-2 {
  top: 50%;
  left: -100px;
  width: 300px;
  height: 300px;
  animation-delay: 2s;
}

.background-decoration.bg-3 {
  bottom: -100px;
  right: 50%;
  width: 350px;
  height: 350px;
  animation-delay: 4s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(5deg);
  }
}

.login-container {
  width: 100%;
  max-width: 420px;
  padding: 50px;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.98), rgba(255, 255, 255, 0.94));
  border-radius: 24px;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.22);
  animation: slideIn 0.5s ease-out;
  position: relative;
  z-index: 1;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.login-container:hover {
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.25);
  transform: translateY(-2px);
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.art-title {
  text-align: center;
  margin-bottom: 30px;
}

.art-title h1 {
  font-size: 36px;
  font-weight: bold;
  background: linear-gradient(135deg, #7ed6d4 0%, #52c41a 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 2px;
  margin: 0 0 10px 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  font-family: 'Microsoft YaHei', '微软雅黑', sans-serif;
}

.art-title .subtitle {
  font-size: 14px;
  color: #666;
  margin: 0;
  opacity: 0.8;
}

.art-title .hint {
  font-size: 13px;
  color: #909399;
  margin: 12px 0 0;
}

.auth-form {
  animation: formFadeIn 0.3s ease;
}

@keyframes formFadeIn {
  from {
    opacity: 0.8;
    transform: translateY(5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.auth-form :deep(.el-form-item) {
  margin-bottom: 20px;
}

.form-input {
  border-radius: 12px !important;
}

.auth-form :deep(.el-input__wrapper) {
  background-color: #f8f9fa;
  border: 2px solid #e8e8e8;
  border-radius: 12px;
  transition: all 0.3s ease;
  height: 50px;
}

.auth-form :deep(.el-input__wrapper:hover) {
  border-color: #7ed6d4;
  background-color: #fff;
  box-shadow: 0 0 0 2px rgba(126, 214, 212, 0.1);
}

.auth-form :deep(.el-input__wrapper.is-focus) {
  border-color: #7ed6d4;
  background-color: #fff;
  box-shadow: 0 0 0 2px rgba(126, 214, 212, 0.2);
}

.form-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  font-size: 14px;
}

.form-footer :deep(.el-checkbox__label) {
  color: #666;
}

.form-footer :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: #7ed6d4;
  border-color: #7ed6d4;
}

.submit-btn {
  width: 100%;
  height: 50px;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(135deg, #7ed6d4 0%, #52c41a 100%);
  border: none;
  border-radius: 12px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(126, 214, 212, 0.4);
}

.submit-btn:active {
  transform: translateY(0);
  box-shadow: 0 6px 12px rgba(126, 214, 212, 0.3);
}

.submit-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: all 0.6s ease;
}

.submit-btn:hover::before {
  left: 100%;
}

.third-party-login {
  margin-top: 30px;
}

.divider {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #e8e8e8;
}

.divider span {
  padding: 0 20px;
  font-size: 14px;
  color: #999;
}

.third-party-icons {
  display: flex;
  justify-content: center;
  gap: 30px;
}

.icon {
  font-size: 24px;
  color: #666;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 10px;
  border-radius: 50%;
  background: #f8f9fa;
}

.icon:hover {
  color: #7ed6d4;
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(126, 214, 212, 0.3);
}

@media (max-width: 768px) {
  .login-container {
    max-width: 90%;
    padding: 30px;
  }
  
  .art-title h1 {
    font-size: 28px;
  }
  
  .background-decoration {
    width: 200px;
    height: 200px;
  }
  
  .background-decoration.bg-2 {
    width: 150px;
    height: 150px;
  }
  
  .background-decoration.bg-3 {
    width: 180px;
    height: 180px;
  }
}
</style>
