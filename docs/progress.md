# Development Progress — 云梦AI代充商城

## Current Status

**T25 force login + order timeout**: ✅ DONE  
**Last Update**: 2026-10-10 04:35 JST

## Post-MVP
- [x] T1–T22 MVP complete
- [x] T24 下单备注
- [x] T23 修改密码
- [x] **T25 强制登录 / 订单超时**

### T25 Features
- `force_login_to_order`：为 true 时未登录下单返回 401；为 false 时允许游客下单（`userId` 可空）
- `order_timeout_minutes`：仅对 PENDING 生效；查询/下单时 `expirePendingOrders` 自动取消并写备注
- 配置页说明已更新；单元测试 `tests/order-timeout.test.ts`
- Schema：`Order.userId` 改为可选

### 本地注意
拉取后执行一次 `npx prisma db push`（userId 可空）

## Suggested next
- T26 真实支付 Provider 骨架

Repo: https://github.com/fymd/yunmeng-mall
