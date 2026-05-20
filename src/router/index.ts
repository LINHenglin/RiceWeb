import type { RouteRecordRaw } from 'vue-router'
import { ElMessage } from 'element-plus'
import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { public: true }
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('../views/Admin.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/login'
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()

  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next('/login')
    return
  }

  if (to.meta.requiresAdmin) {
    if (!userStore.isLoggedIn) {
      next('/login')
      return
    }
    if (!userStore.userInfo) {
      await userStore.getUserInfo()
    }
    if (userStore.userInfo?.role !== 'admin') {
      ElMessage.warning('无管理员权限。普通用户请使用微信小程序。')
      await userStore.logout()
      next('/login')
      return
    }
  }

  if (to.path === '/login' && userStore.isLoggedIn) {
    if (!userStore.userInfo) {
      await userStore.getUserInfo()
    }
    if (userStore.userInfo?.role === 'admin') {
      next('/admin')
      return
    }
  }

  next()
})

export default router
