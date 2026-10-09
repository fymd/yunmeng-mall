# Development Progress — 云梦AI代充商城

## Current Status

**T24 Order remark on checkout**: ✅ DONE  
**Last Update**: 2026-10-10 04:20 JST

## Post-MVP
- [x] T1–T22 MVP complete
- [x] **T24 下单备注**

### T24 Features
- POST `/api/orders` accepts optional `remark` (trim, max 500)
- Product detail modal: remark textarea (e.g. recharge email)
- Success modal + my orders / order query show remark
- Admin list/search already supported remark; PATCH sanitizes length

### Flow
1. 打开商品详情 → 填写备注（选填）→ 购买
2. 备注写入订单，后台发货时可在备注中追加发货信息

## Suggested next
- T23 修改管理员密码
- T25 强制登录 / 订单超时生效
- T26 真实支付 Provider

Repo: https://github.com/fymd/yunmeng-mall
