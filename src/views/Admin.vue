<template>
  <div class="admin-page">
    <div class="admin-navbar">
      <div class="navbar-left">
        <span class="nav-brand">Web 管理端</span>
      </div>
      <div class="navbar-center">
        <h1 class="navbar-title">管理后台</h1>
      </div>
      <div class="navbar-right">
        <el-button type="text" @click="handleLogout" class="nav-btn">
          <span>退出登录</span>
        </el-button>
      </div>
    </div>

    <div class="admin-main">
      <el-tabs v-model="activeTab" class="admin-tabs">
        <el-tab-pane label="数据概览" name="stats">
          <div v-loading="statsLoading" class="stats-grid">
            <el-card v-for="item in statCards" :key="item.key" class="stat-card" shadow="hover">
              <div class="stat-inner">
                <span class="stat-icon">{{ item.icon }}</span>
                <div class="stat-text">
                  <div class="stat-value">{{ item.value }}</div>
                  <div class="stat-label">{{ item.label }}</div>
                </div>
              </div>
            </el-card>
          </div>
          <div class="stats-actions">
            <el-button type="primary" :loading="statsLoading" @click="loadStats">刷新数据</el-button>
          </div>
        </el-tab-pane>

        <el-tab-pane label="用户管理" name="users">
          <div class="user-panel">
            <div class="user-toolbar">
              <el-input
                v-model="keyword"
                clearable
                placeholder="搜索用户名"
                class="search-input"
                @clear="handleSearch"
                @keyup.enter="handleSearch"
              />
              <el-button type="primary" @click="handleSearch">搜索</el-button>
            </div>

            <div class="user-table-frame">
            <el-table
              :data="userRows"
              v-loading="userLoading"
              stripe
              size="small"
              class="user-table"
              style="width: 100%"
              table-layout="fixed"
            >
              <el-table-column label="头像" :width="72" align="center" header-align="center">
                <template #default="{ row }">
                  <div class="user-avatar-cell" role="button" tabindex="0" @click="openAvatarPreview(row)" @keyup.enter="openAvatarPreview(row)">
                    <el-avatar :size="36" :src="avatarCellSrc(row)" class="user-avatar-thumb">
                      {{ avatarLetter(row.username) }}
                    </el-avatar>
                  </div>
                </template>
              </el-table-column>
              <el-table-column
                prop="username"
                label="用户名"
                :width="126"
                show-overflow-tooltip
                align="left"
                header-align="left"
              />
              <el-table-column prop="role" label="角色" :width="112" align="center" header-align="center">
                <template #default="{ row }">
                  <el-tag :type="row.role === 'admin' ? 'danger' : 'info'" size="small">
                    {{ row.role === 'admin' ? '管理员' : '用户' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="disabled" label="状态" :width="112" align="center" header-align="center">
                <template #default="{ row }">
                  <el-tag :type="row.disabled ? 'danger' : 'success'" size="small">
                    {{ row.disabled ? '已禁用' : '正常' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column
                label="注册时间"
                min-width="196"
                align="center"
                header-align="center"
                show-overflow-tooltip
              >
                <template #default="{ row }">
                  {{ formatCreateTime(row.createTime) }}
                </template>
              </el-table-column>
              <el-table-column label="操作" :width="292" align="center" header-align="center">
                <template #default="{ row }">
                  <div class="user-actions">
                    <el-button
                      v-if="!row.disabled"
                      type="warning"
                      size="small"
                      :disabled="row.role === 'admin'"
                      @click="toggleUserStatus(row, true)"
                    >
                      禁用
                    </el-button>
                    <el-button v-else type="success" size="small" @click="toggleUserStatus(row, false)">
                      启用
                    </el-button>
                    <el-button
                      type="primary"
                      size="small"
                      plain
                      :disabled="row.role === 'admin'"
                      :loading="resettingUserId === row.userId"
                      @click="resetUserPassword(row)"
                    >
                      重置密码
                    </el-button>
                    <el-button
                      type="danger"
                      size="small"
                      :disabled="row.role === 'admin'"
                      @click="deleteUser(row)"
                    >
                      删除
                    </el-button>
                  </div>
                </template>
              </el-table-column>
            </el-table>
            </div>

            <div class="user-pagination">
              <el-pagination
                v-model:current-page="userPage"
                v-model:page-size="userPageSize"
                :total="userTotal"
                :page-sizes="[10, 20, 50]"
                size="small"
                layout="total, sizes, prev, pager, next"
                @current-change="loadUsers"
                @size-change="loadUsers"
              />
            </div>

            <el-dialog
              v-model="avatarPreviewVisible"
              title="头像预览"
              width="420px"
              align-center
              append-to-body
              destroy-on-close
              class="avatar-preview-dialog"
              @closed="onAvatarPreviewClosed"
            >
              <div class="avatar-preview-body">
                <img v-if="avatarPreviewUrl" :src="avatarPreviewUrl" alt="用户头像" class="avatar-preview-img" />
                <el-avatar v-else :size="160" class="avatar-preview-placeholder">
                  {{ avatarPreviewLetter }}
                </el-avatar>
              </div>
            </el-dialog>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { adminApi } from '../utils/api'
import { useUserStore } from '../stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const userStore = useUserStore()
const activeTab = ref('stats')

const statsLoading = ref(false)
const stats = ref({
  userCount: 0,
  detectionCount: 0,
  chatSessionCount: 0,
  todayDetectionCount: 0
})

const statCards = computed(() => [
  { key: 'users', icon: '👤', label: '注册用户', value: stats.value.userCount },
  { key: 'detect', icon: '🔬', label: '累计识别次数', value: stats.value.detectionCount },
  { key: 'chat', icon: '💬', label: '对话会话数', value: stats.value.chatSessionCount },
  { key: 'today', icon: '📅', label: '今日识别次数', value: stats.value.todayDetectionCount }
])

const userLoading = ref(false)
const userRows = ref<any[]>([])
const userPage = ref(1)
const userPageSize = ref(10)
const userTotal = ref(0)
const keyword = ref('')
const resettingUserId = ref<number | null>(null)

const avatarPreviewVisible = ref(false)
const avatarPreviewUrl = ref('')
const avatarPreviewLetter = ref('')

const avatarLetter = (username: string | undefined) => {
  const s = username?.trim()
  if (!s) return '?'
  return s.charAt(0).toUpperCase()
}

const avatarCellSrc = (row: any): string | undefined => {
  const u = row?.avatarUrl
  if (typeof u !== 'string') return undefined
  const t = u.trim()
  return t.length > 0 ? t : undefined
}

const openAvatarPreview = (row: any) => {
  avatarPreviewUrl.value = avatarCellSrc(row) ?? ''
  avatarPreviewLetter.value = avatarLetter(row?.username)
  avatarPreviewVisible.value = true
}

const onAvatarPreviewClosed = () => {
  avatarPreviewUrl.value = ''
  avatarPreviewLetter.value = ''
}

const formatCreateTime = (val: string | undefined) => {
  if (!val) return '—'
  const d = new Date(val)
  if (Number.isNaN(d.getTime())) return String(val)
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
}

const handleLogout = async () => {
  await userStore.logout()
  router.push('/login')
}

const loadStats = async () => {
  statsLoading.value = true
  try {
    const res: any = await adminApi.getStats()
    if (res.data) {
      stats.value = {
        userCount: res.data.userCount ?? 0,
        detectionCount: res.data.detectionCount ?? 0,
        chatSessionCount: res.data.chatSessionCount ?? 0,
        todayDetectionCount: res.data.todayDetectionCount ?? 0
      }
    }
  } catch (e: any) {
    console.error('[Admin] 加载统计失败', e)
    ElMessage.error(e?.message || '加载统计数据失败')
  } finally {
    statsLoading.value = false
  }
}

const loadUsers = async () => {
  userLoading.value = true
  try {
    const res: any = await adminApi.getUserPage({
      page: userPage.value,
      pageSize: userPageSize.value,
      keyword: keyword.value.trim() || undefined
    })
    if (res.data) {
      userRows.value = res.data.records || []
      userTotal.value = res.data.total ?? 0
    }
  } catch (e: any) {
    console.error('[Admin] 加载用户列表失败', e)
    ElMessage.error(e?.message || '加载用户列表失败')
    userRows.value = []
    userTotal.value = 0
  } finally {
    userLoading.value = false
  }
}

const handleSearch = () => {
  userPage.value = 1
  loadUsers()
}

const toggleUserStatus = async (row: any, disabled: boolean) => {
  const action = disabled ? '禁用' : '启用'
  try {
    await ElMessageBox.confirm(`确定要${action}用户「${row.username}」吗？`, '提示', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
  } catch {
    return
  }

  try {
    await adminApi.setUserStatus({ userId: row.userId, disabled })
    ElMessage.success(`已${action}`)
    await loadUsers()
  } catch (e: any) {
    ElMessage.error(e?.message || `${action}失败`)
  }
}

const resetUserPassword = async (row: any) => {
  if (row.role === 'admin') {
    ElMessage.warning('不能重置管理员账号的密码')
    return
  }
  try {
    await ElMessageBox.confirm(
      `将用户「${row.username}」的登录密码重置为默认密码「123456」。\n请提醒对方登录后尽快修改密码。是否继续？`,
      '重置密码',
      {
        type: 'warning',
        confirmButtonText: '确定重置',
        cancelButtonText: '取消'
      }
    )
  } catch {
    return
  }

  resettingUserId.value = row.userId
  try {
    await adminApi.resetPassword({ userId: row.userId })
    ElMessage.success('密码已重置为 123456，请通知用户尽快修改密码')
  } catch (e: any) {
    ElMessage.error(e?.message || '重置失败')
  } finally {
    resettingUserId.value = null
  }
}

const deleteUser = async (row: any) => {
  if (row.role === 'admin') {
    ElMessage.warning('不能删除管理员账号')
    return
  }
  try {
    await ElMessageBox.confirm(
      `确定永久删除用户「${row.username}」？将同时删除该用户的检测记录与聊天会话，且不可恢复。`,
      '删除用户',
      {
        type: 'warning',
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        confirmButtonClass: 'el-button--danger'
      }
    )
  } catch {
    return
  }

  try {
    await adminApi.deleteUser({ userId: row.userId })
    ElMessage.success('已删除用户')
    await loadUsers()
    await loadStats()
  } catch (e: any) {
    ElMessage.error(e?.message || '删除失败')
  }
}

watch(activeTab, (name) => {
  if (name === 'users' && userRows.value.length === 0 && !userLoading.value) {
    loadUsers()
  }
})

onMounted(() => {
  loadStats()
})
</script>

<style scoped>
.admin-page {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: radial-gradient(circle at top left, #e6f9f0 0%, #b2e1e0 40%, #89c9a6 100%);
}

.admin-navbar {
  height: 70px;
  background: rgba(255, 255, 255, 0.95);
  border-bottom: 2px solid rgba(126, 214, 212, 0.2);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  backdrop-filter: blur(10px);
  position: sticky;
  top: 0;
  z-index: 100;
}

.navbar-left,
.navbar-right {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.navbar-left {
  justify-content: flex-start;
}

.nav-brand {
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
}

.navbar-right {
  justify-content: flex-end;
}

.navbar-center {
  flex: 2;
  text-align: center;
}

.navbar-title {
  margin: 0;
  font-size: 24px;
  font-weight: bold;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--success-color) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.nav-btn {
  color: var(--primary-color);
  font-size: 16px;
  transition: all var(--transition-normal);
  padding: 8px 16px;
  border-radius: var(--radius-md);
}

.nav-btn:hover {
  color: var(--success-color);
  background: rgba(126, 214, 212, 0.1);
  transform: translateY(-2px);
}

.admin-main {
  flex: 1;
  padding: var(--spacing-xl) var(--spacing-lg);
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.admin-tabs :deep(.el-tabs__header) {
  margin-bottom: 16px;
}

.admin-tabs :deep(.el-tabs__item) {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-secondary);
  transition: all var(--transition-normal);
}

.admin-tabs :deep(.el-tabs__item:hover) {
  color: var(--primary-color);
}

.admin-tabs :deep(.el-tabs__item.is-active) {
  color: var(--primary-color);
}

.admin-tabs :deep(.el-tabs__active-bar) {
  background: linear-gradient(90deg, var(--primary-color), var(--success-color));
  height: 3px;
  border-radius: 1.5px;
}

.admin-tabs {
  width: 100%;
}

.admin-tabs :deep(.el-tabs__content),
.admin-tabs :deep(.el-tab-pane) {
  width: 100%;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
  min-height: 120px;
  margin-bottom: var(--spacing-xl);
}

.stat-card {
  border-radius: var(--radius-lg);
  border: 1px solid rgba(126, 214, 212, 0.2);
  background: white;
  box-shadow: var(--shadow-md);
  transition: all var(--transition-normal);
  animation: fadeIn var(--transition-normal);
}

.stat-card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}

.stat-inner {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
}

.stat-icon {
  font-size: 40px;
  line-height: 1;
  animation: float 3s ease-in-out infinite;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: var(--text-primary);
  line-height: 1.2;
}

.stat-label {
  font-size: 14px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.stats-actions {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.stats-actions .el-button {
  background: linear-gradient(135deg, var(--primary-color), var(--success-color));
  border: none;
  color: white;
  border-radius: var(--radius-md);
  transition: all var(--transition-normal);
}

.stats-actions .el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(126, 214, 212, 0.4);
}

.user-panel {
  width: 100%;
  box-sizing: border-box;
  background: #fff;
  border-radius: var(--radius-lg);
  border: 1px solid rgba(126, 214, 212, 0.22);
  box-shadow: var(--shadow-md);
  padding: 22px 24px 20px;
}

.user-toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 18px;
  flex-wrap: wrap;
  align-items: center;
}

.search-input {
  max-width: 320px;
  flex: 1;
  min-width: 200px;
}

.search-input :deep(.el-input__wrapper) {
  background: var(--background-light);
  border: 1px solid rgba(126, 214, 212, 0.2);
  border-radius: var(--radius-md);
  transition: all var(--transition-normal);
}

.search-input :deep(.el-input__wrapper:hover) {
  border-color: var(--primary-color);
  background: white;
}

.search-input :deep(.el-input__wrapper.is-focus) {
  border-color: var(--primary-color);
  background: white;
  box-shadow: 0 0 0 2px rgba(126, 214, 212, 0.1);
}

.user-toolbar .el-button {
  background: linear-gradient(135deg, var(--primary-color), var(--success-color));
  border: none;
  color: white;
  border-radius: var(--radius-md);
  transition: all var(--transition-normal);
}

.user-toolbar .el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(126, 214, 212, 0.4);
}

.user-avatar-cell {
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: zoom-in;
  outline: none;
}

.user-avatar-cell:focus-visible {
  border-radius: var(--radius-full);
  box-shadow: 0 0 0 2px rgba(126, 214, 212, 0.45);
}

.user-avatar-thumb {
  flex-shrink: 0;
}

.user-avatar-thumb :deep(img) {
  object-fit: cover;
}

.avatar-preview-dialog .avatar-preview-body {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 160px;
  padding: 8px 0 4px;
}

.avatar-preview-img {
  display: block;
  max-width: 100%;
  max-height: min(70vh, 380px);
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: var(--radius-md);
}

.avatar-preview-placeholder {
  flex-shrink: 0;
}

.user-table-frame {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  border-radius: var(--radius-md);
  border: 1px solid rgba(126, 214, 212, 0.14);
  background: #fff;
  animation: fadeIn var(--transition-normal);
}

.user-table {
  width: 100%;
  border-radius: 0;
  overflow: visible;
  border: none;
  animation: none;
}

.user-table :deep(.el-table) {
  width: 100%;
  --el-table-border-color: rgba(126, 214, 212, 0.12);
}

.user-table :deep(.el-table__inner-wrapper) {
  width: 100%;
}

.user-table :deep(.el-table__body-wrapper),
.user-table :deep(.el-table__header-wrapper) {
  width: 100%;
}

.user-table :deep(table) {
  width: 100% !important;
  table-layout: fixed;
}

.user-table :deep(.el-table th.el-table__cell) {
  background: var(--background-light);
  color: var(--text-secondary);
  font-weight: 600;
  font-size: 13px;
  padding: 12px 20px;
  border-bottom: 1px solid rgba(126, 214, 212, 0.12);
}

.user-table :deep(.el-table td.el-table__cell) {
  padding: 10px 18px;
  font-size: 13px;
  border-bottom: 1px solid rgba(126, 214, 212, 0.06);
  vertical-align: middle;
}

.user-table :deep(.el-table td.el-table__cell .cell) {
  line-height: 1.45;
}

/* 表头/表体统一： horizontal 留白只来自 th/td，避免 EP 默认 .cell padding 导致「注册时间」标题与内容错位 */
.user-table :deep(.el-table th.el-table__cell > .cell),
.user-table :deep(.el-table td.el-table__cell > .cell) {
  padding-left: 0 !important;
  padding-right: 0 !important;
}

/* 列间距：再略放宽；注册时间列 min-width 吸收剩余宽度，整表仍 100% 铺满白框 */
.user-table :deep(.el-table__header-wrapper th:nth-child(1)),
.user-table :deep(.el-table__body-wrapper td:nth-child(1)) {
  padding-right: 28px;
}

.user-table :deep(.el-table__header-wrapper th:nth-child(2)),
.user-table :deep(.el-table__body-wrapper td:nth-child(2)) {
  padding-left: 20px;
  padding-right: 18px;
}

.user-table :deep(.el-table__header-wrapper th:nth-child(3)),
.user-table :deep(.el-table__body-wrapper td:nth-child(3)) {
  padding-left: 16px;
  padding-right: 22px;
}

.user-table :deep(.el-table__header-wrapper th:nth-child(4)),
.user-table :deep(.el-table__body-wrapper td:nth-child(4)) {
  padding-left: 16px;
  padding-right: 22px;
}

.user-table :deep(.el-table__header-wrapper th:nth-child(5)),
.user-table :deep(.el-table__body-wrapper td:nth-child(5)) {
  padding-left: 18px;
  padding-right: 26px;
}

.user-table :deep(.el-table__header-wrapper th:nth-child(6)),
.user-table :deep(.el-table__body-wrapper td:nth-child(6)) {
  padding-left: 20px;
  padding-right: 20px;
}

.user-table :deep(.el-table__row:hover) {
  background: rgba(126, 214, 212, 0.05);
}

/* 标签列：单元格默认 overflow:hidden 会裁掉 Tag 圆角；略增列宽后仍保证可视 */
.user-table :deep(.el-table__body-wrapper td:nth-child(3) > .cell),
.user-table :deep(.el-table__body-wrapper td:nth-child(4) > .cell),
.user-table :deep(.el-table__header-wrapper th:nth-child(3) > .cell),
.user-table :deep(.el-table__header-wrapper th:nth-child(4) > .cell) {
  overflow: visible;
}

.user-table :deep(.el-tag) {
  border-radius: var(--radius-full);
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 500;
  max-width: none;
}

.user-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  align-items: center;
}

.user-pagination {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid rgba(126, 214, 212, 0.14);
}

.user-pagination :deep(.el-pagination__item:hover) {
  color: var(--primary-color);
}

.user-pagination :deep(.el-pagination__item.is-current) {
  background: var(--primary-color);
  border-color: var(--primary-color);
}

/* 响应式 */
@media (max-width: 768px) {
  .admin-main {
    padding: var(--spacing-lg) var(--spacing-md);
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .user-toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-input {
    max-width: 100%;
  }
  
  .navbar-title {
    font-size: 20px;
  }
  
  .nav-btn {
    font-size: 14px;
    padding: 6px 12px;
  }
}
</style>
