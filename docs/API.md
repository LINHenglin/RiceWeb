# 前端对接接口文档

本文档根据 `src/utils/request.ts`、`src/utils/api.ts` 及各页面调用整理，供后端实现与联调使用。

## 1. 基础约定

| 项目 | 说明 |
|------|------|
| **Base URL** | `http://10.141.47.32:8080`（见 `request.ts`，部署时以实际环境为准） |
| **超时** | 30s |
| **鉴权** | 需登录的接口：请求头携带 `Authorization: <token>`（与登录返回的 token 一致；**无 `Bearer ` 前缀**） |
| **HTTP 401** | 前端会清除本地 token 并提示「登录已过期」 |

### 1.1 统一响应体

前端 axios 拦截器约定业务成功条件为：

- `code === "200"` 或 `code === "1"`，或  
- `success === true`

否则视为失败，`message` 为错误文案。

```json
{
  "code": "200",
  "message": "ok",
  "data": {}
}
```

`code` 可为数字，前端会转为字符串比较。

---

## 2. 用户模块

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/user/user/login` | 登录 |
| POST | `/user/user/register` | 注册 |
| GET | `/user/user/getUserInfo` | 当前用户信息 |
| POST | `/user/user/updateUser` | 更新资料 |
| POST | `/user/user/logout` | 退出 |

### 2.1 登录 `POST /user/user/login`

**Body（JSON）**

| 字段 | 类型 | 说明 |
|------|------|------|
| username | string | 用户名 |
| password | string | 密码 |

**成功时 `data`**

- 前端期望 **`data` 为 token 字符串**（直接写入 `localStorage` 并用于 `Authorization`）。

### 2.2 注册 `POST /user/user/register`

**Body（JSON）**

| 字段 | 类型 | 说明 |
|------|------|------|
| username | string | 用户名 |
| password | string | 密码 |
| email | string | 邮箱 |

### 2.3 获取用户信息 `GET /user/user/getUserInfo`

**成功时 `data` 对象（字段与前端展示/管理相关）**

| 字段 | 类型 | 说明 |
|------|------|------|
| userId | number | 用户 ID |
| username | string | 用户名 |
| email | string | 邮箱 |
| phone | string | 手机 |
| avatarUrl | string | 头像 URL |
| createTime | string | 注册时间 |
| **role** | string | **可选**：`"admin"` 表示管理员，用于显示「管理后台」入口与路由权限 |

### 2.4 更新用户 `POST /user/user/updateUser`

**Body（JSON）**

| 字段 | 类型 | 说明 |
|------|------|------|
| userId | number | 用户 ID |
| username | string | 用户名 |
| email | string | 邮箱 |
| phone | string | 手机 |
| avatarUrl | string | 头像 URL |

**成功时 `data`**：更新后的用户对象（含 `avatarUrl` 等）。

### 2.5 退出 `POST /user/user/logout`

无强制 Body；前端会先清本地 token，接口失败亦忽略。

---

## 3. 通用文件上传

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/common/file/upload/image` | 图片上传 |

**请求**：`multipart/form-data`，字段名 **`image`**（`File`）。

**成功时 `data`**（前端兼容三种形式，任选一种实现即可）

- 直接为 **字符串**：图片访问 URL；或  
- `{ "url": "..." }`；或  
- `{ "imgUrl": "..." }`。

---

## 4. AI 业务模块

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/user/ai/classify` | 图像分类（预留，当前页面未调用） |
| POST | `/user/ai/segment` | 图像分割（预留） |
| POST | `/user/ai/diagnosis` | 水稻病虫害识别 |
| POST | `/user/ai/detectionRecodePageQuery` | 检测记录分页 |
| GET | `/user/ai/detectionRecodeDetail/{id}` | 检测记录详情 |
| POST | `/user/ai/chat` | 多轮对话 |
| POST | `/user/ai/chatRecodePageQuery` | 对话记录分页 |
| GET | `/user/ai/chatRecodeDetail/{memoryId}` | 会话消息详情 |

### 4.1 分类 / 分割（预留）

**POST** `/user/ai/classify`、`/user/ai/segment`  

**Body**：`multipart/form-data`，字段名 **`file`**。

### 4.2 识别 `POST /user/ai/diagnosis`

**Body（JSON）**

| 字段 | 类型 | 说明 |
|------|------|------|
| riceVariety | string | 水稻品种 |
| symptomDesc | string | 症状描述 |
| imageUrl | string | 已由上传接口返回的图片 URL |

**成功时 `data`**

| 字段 | 类型 | 说明 |
|------|------|------|
| imgUrl | string | 可选，原图 |
| analysisResult | string | Markdown 分析报告 |
| mergedImageUrl | string | 可选 |
| binaryMaskUrl | string | 可选 |
| createTime | string | 识别时间 |
| detectionRecordId | number | 记录 ID |
| memoryId | string | 会话 ID（与聊天关联） |

### 4.3 检测记录分页 `POST /user/ai/detectionRecodePageQuery`

**Body（JSON）**

| 字段 | 类型 | 说明 |
|------|------|------|
| page | number | 页码 |
| pageSize | number | 每页条数 |

**成功时 `data`**

| 字段 | 类型 | 说明 |
|------|------|------|
| records | array | 列表项含 `detectionRecordId`、`diagnosis`、`createTime` 等 |
| total | number | 总条数 |

### 4.4 检测记录详情 `GET /user/ai/detectionRecodeDetail/{id}`

路径参数 `id` 为 `detectionRecordId`。

**成功时 `data`**：与 4.2 中识别结果 `data` 结构一致。

### 4.5 对话 `POST /user/ai/chat`

**Body（JSON）**

| 字段 | 类型 | 说明 |
|------|------|------|
| memoryId | string | 会话 ID |
| question | string | 用户问题 |

**Header**：`Content-Type: application/json`

**成功时 `data`**：字符串，AI 回复正文（支持 Markdown）。

### 4.6 对话记录分页 `POST /user/ai/chatRecodePageQuery`

**Body（JSON）**

| 字段 | 类型 | 说明 |
|------|------|------|
| page | number | 页码 |
| pageSize | number | 每页条数 |

**成功时 `data`**

| 字段 | 类型 | 说明 |
|------|------|------|
| records | array | 见下表 |
| total | number | 总条数 |

**`records[]` 单项**

| 字段 | 类型 | 说明 |
|------|------|------|
| chatRecodeId | number | 记录主键 |
| memoryId | string | 会话 ID |
| firstQuestion | string | 首条问题摘要 |
| createTime | string | 创建时间 |
| expirationTime | string | 过期时间 |
| userId | number | 用户 ID |

### 4.7 对话详情 `GET /user/ai/chatRecodeDetail/{memoryId}`

**成功时 `data`**

| 字段 | 类型 | 说明 |
|------|------|------|
| messages | array | `{ "role": "user"\|"assistant"\|..., "content": string }` |

前端仅展示 `role` 为 `user` / `assistant` 的消息。

---

## 5. 管理端模块

以下接口供 **管理员** 使用：需登录，且 `getUserInfo` 返回 `role === "admin"`。  

前端路由：`/admin`（`meta.requiresAdmin`）。

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/admin/stats` | 仪表盘统计 |
| POST | `/admin/user/pageQuery` | 用户分页列表 |
| POST | `/admin/user/status` | 启用/禁用用户 |

### 5.1 仪表盘 `GET /admin/stats`

**成功时 `data`**

| 字段 | 类型 | 说明 |
|------|------|------|
| userCount | number | 注册用户总数 |
| detectionCount | number | 累计识别次数 |
| chatSessionCount | number | 对话会话数 |
| todayDetectionCount | number | 今日识别次数 |

### 5.2 用户分页 `POST /admin/user/pageQuery`

**Body（JSON）**

| 字段 | 类型 | 说明 |
|------|------|------|
| page | number | 页码 |
| pageSize | number | 每页条数 |
| keyword | string | 可选，用户名或邮箱模糊搜索 |

**成功时 `data`**

| 字段 | 类型 | 说明 |
|------|------|------|
| records | array | 用户列表 |
| total | number | 总条数 |

**`records[]` 单项**

| 字段 | 类型 | 说明 |
|------|------|------|
| userId | number | |
| username | string | |
| email | string | |
| phone | string | |
| role | string | 如 `admin` / `user` |
| disabled | boolean | 是否禁用 |
| createTime | string | 注册时间 |

前端规则：对 `role === 'admin'` 的用户不展示「禁用」按钮。

### 5.3 用户状态 `POST /admin/user/status`

**Body（JSON）**

| 字段 | 类型 | 说明 |
|------|------|------|
| userId | number | 目标用户 ID |
| disabled | boolean | `true` 禁用，`false` 启用 |

**说明**：建议后端禁止禁用其它管理员或最后一个管理员（前端仅隐藏管理员行的禁用按钮，仍应在服务端校验）。

---

## 6. 与实现差异时的注意点

1. **Authorization**：若后端仅支持 `Bearer <token>`，需同步修改前端 `request.ts` 或后端兼容无前缀。  
2. **`getUserInfo.role`**：未返回或不为 `admin` 时，不显示管理入口且无法进入 `/admin`。  
3. **删除会话**：前端聊天页删除对话为本地删除，**未对接删除会话接口**。  
4. **`classify` / `segment`**：已封装，页面未使用，可后续再接。

---

## 7. 前端路由与权限（参考）

| 路径 | 说明 |
|------|------|
| `/login` | 登录/注册 |
| `/diagnosis` | 识别 |
| `/chat` | 对话 |
| `/profile` | 个人中心 |
| `/admin` | 管理后台（需登录 + `role === 'admin'`） |
