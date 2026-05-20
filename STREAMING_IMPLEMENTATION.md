# 流式输出功能实现说明

## 📋 修改内容

### 1. 前端已完成的修改

#### ✅ `src/utils/api.ts`
- 新增 `chatStream` 方法，使用 Fetch API 和 ReadableStream 实现流式传输
- 支持 SSE (Server-Sent Events) 格式的数据接收
- 自动处理数据块解析和错误处理

#### ✅ `src/views/Chat.vue`
- 修改 `sendMessage` 方法，使用流式输出替代传统请求
- 实时显示 AI 回复内容（逐字显示效果）
- 优化错误处理：即使流中断也会保留已接收的内容
- 新对话第一条消息发送完成后自动刷新历史记录
- 修复 `selectChat` 方法，正确加载历史消息时间戳

### 2. 核心改进点

| 改进项 | 之前 | 现在 |
|--------|------|------|
| 消息显示 | 等待完整响应后显示 | 实时逐字显示 |
| 加载状态 | 一直显示"..." | 实时显示内容 |
| 错误处理 | 完全失败，消息消失 | 保留已接收内容 + 错误提示 |
| 用户体验 | 长时间等待无反馈 | 即时看到 AI 思考过程 |

---

## 🔧 后端需要提供的接口

### 接口地址
```
POST /user/ai/chat/stream
```

### 请求参数
```json
{
  "memoryId": "memoryid1234567890",
  "question": "用户的问题"
}
```

### 响应格式（SSE - Server-Sent Events）

后端需要返回流式数据，格式如下：

```
data: {"content": "你"}
data: {"content": "好"}
data: {"content": "，"}
data: {"content": "我"}
data: {"content": "是"}
data: {"content": "AI"}
data: {"content": "助"}
data: {"content": "手"}
data: [DONE]
```

### 错误情况
如果发生错误，返回：
```
data: {"error": "错误信息描述"}
```

### 后端实现要点（Java Spring Boot 示例）

```java
@PostMapping("/chat/stream")
public void chatStream(@RequestBody ChatRequest request, 
                       HttpServletResponse response) throws IOException {
    // 设置 SSE 响应头
    response.setContentType("text/event-stream");
    response.setCharacterEncoding("UTF-8");
    response.setHeader("Cache-Control", "no-cache");
    response.setHeader("Connection", "keep-alive");
    
    PrintWriter writer = response.getWriter();
    
    try {
        // 调用 AI 模型，逐块获取结果
        aiService.chatStream(request.getMemoryId(), request.getQuestion(), chunk -> {
            // 发送每个数据块
            writer.write("data: {\"content\":\"" + escapeJson(chunk) + "\"}\n\n");
            writer.flush();
        });
        
        // 发送完成标记
        writer.write("data: [DONE]\n\n");
        writer.flush();
        
    } catch (Exception e) {
        // 发送错误信息
        writer.write("data: {\"error\":\"" + escapeJson(e.getMessage()) + "\"}\n\n");
        writer.flush();
    } finally {
        writer.close();
    }
}
```

**关键点：**
1. 移除 `@Transactional` 注解，防止事务回滚
2. 不要抛出异常，而是捕获并返回错误消息
3. 确保每条消息都保存到数据库（即使用户端断开连接）
4. 使用 `writer.flush()` 立即发送数据到客户端

---

## 🧪 测试步骤

### 1. 清除旧数据
```sql
-- 删除之前被回滚的不完整记录
DELETE FROM chat_record WHERE memory_id LIKE 'memoryid%' AND content IS NULL;
```

### 2. 重启后端应用
确保新的流式接口生效

### 3. 前端测试
1. 打开浏览器开发者工具（F12）
2. 切换到 Network 标签
3. 在聊天界面发送一条消息
4. 观察：
   - 应该能看到 `/user/ai/chat/stream` 请求
   - Type 应该是 `eventsource` 或 `fetch`
   - 消息应该逐字显示，而不是等待完整响应
   - 不应该一直显示"..."加载状态

### 4. 验证消息保存
检查数据库中是否有完整的对话记录

---

## ⚠️ 注意事项

### 前端
1. **CORS 配置**：如果使用不同的域名，后端需要配置 CORS 允许流式请求
2. **Token 过期**：流式传输过程中如果 Token 过期，会触发错误处理
3. **网络中断**：如果网络中断，会保留已接收的内容并显示警告

### 后端
1. **不要使用 @Transactional**：避免事务回滚导致消息丢失
2. **及时 flush**：每发送一个数据块都要调用 `flush()`
3. **异常处理**：捕获所有异常并返回友好的错误消息
4. **数据库保存**：在发送给用户之前先保存到数据库

---

## 🎯 预期效果

✅ 用户发送消息后，立即看到 AI 开始逐字回复  
✅ 不再出现"..."一直加载的情况  
✅ 即使后端出错，也能看到错误提示和部分回复  
✅ 新对话会自动出现在左侧历史记录中  
✅ 切换对话时能正确加载历史消息  

---

## 📞 问题排查

### 问题1：前端报错 "Response body is not readable"
**原因**：后端没有正确设置 SSE 响应头  
**解决**：确保后端设置了 `Content-Type: text/event-stream`

### 问题2：消息仍然不显示
**原因**：后端可能还在使用旧的接口  
**解决**：
1. 确认后端已重启
2. 检查浏览器控制台是否有错误
3. 查看 Network 标签中的请求状态

### 问题3：流式传输很慢
**原因**：可能是网络问题或后端 AI 模型响应慢  
**解决**：
1. 检查网络连接
2. 优化后端 AI 调用逻辑
3. 考虑使用更快的 AI 模型

---

## 📝 后续优化建议

1. **添加重连机制**：如果流中断，自动重新连接
2. **支持取消生成**：用户可以中途停止 AI 回复
3. **打字机效果**：更平滑的逐字显示动画
4. **消息缓存**：本地缓存消息，减少重复请求
5. **离线支持**：网络断开时也能查看历史消息

---

**最后更新**: 2026-04-06  
**版本**: v1.0
