# Development Progress — 云梦AI代充商城

## Current Status

**IM customer service (SSE real-time)**: ✅ DONE  
**Last Update**: 2026-10-10 06:05 JST

### IM Features
- `GET /api/chat/stream` SSE（访客 session / 管理员 inbox）
- 进程内 `chat-bus` 发布订阅；断线自动降级轮询
- 前台气泡会话 + 未读角标 + 连接状态
- 后台 IM 会话列表实时刷新、打开会话标已读

Note: 单机部署实时推送有效；多副本需后续接 Redis Pub/Sub。

Repo: https://github.com/fymd/yunmeng-mall
