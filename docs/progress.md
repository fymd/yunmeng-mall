# Development Progress — 云梦AI代充商城

## Current Status

**Batch features (i18n / upload / chat / mail / charts / proxy)**: ✅ DONE  
**Last Update**: 2026-10-10 05:40 JST

### New
- 中英切换 `LocaleProvider`（Header）
- 商品图上传 `POST /api/upload` → `/uploads/...`
- 站内客服留言 `ChatMessage` + 悬浮窗 + 后台消息
- SMTP 通知配置键 + `notifyOrderEvent`（需配置才发送）
- 后台概览图表 `/api/stats`
- `docs/deploy-proxy.md` Nginx/Caddy 示例

```bash
npx prisma db push
```

Repo: https://github.com/fymd/yunmeng-mall
