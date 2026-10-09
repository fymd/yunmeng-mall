# Development Progress — 云梦AI代充商城

## Current Status

**T26 Payment provider skeleton**: ✅ DONE  
**Last Update**: 2026-10-10 04:45 JST

## Post-MVP
- [x] T1–T22 MVP
- [x] T23 改密 · T24 备注 · T25 强制登录/超时
- [x] **T26 支付宝/微信 Provider 骨架**

### T26 Features
- `src/lib/payment/*`：Mock / Alipay / Wechat + `resolvePaymentProvider`
- 未配置密钥 → 下单失败并取消订单；已配置 → PENDING + `payUrl`（stub）
- Notify：`/api/payment/alipay/notify`、`/api/payment/wechat/notify` + `markOrderPaidByOrderNo`
- 前台成功弹窗支持「前往支付」
- 文档：`docs/payment.md`；测试：`tests/payment.test.ts`

Repo: https://github.com/fymd/yunmeng-mall
