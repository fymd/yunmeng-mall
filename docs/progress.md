# Development Progress — 云梦AI代充商城

## Current Status

**T23 Change password**: ✅ DONE  
**Last Update**: 2026-10-10 04:25 JST

## Post-MVP
- [x] T1–T22 MVP complete
- [x] T24 下单备注
- [x] **T23 修改密码**

### T23 Features
- `changePassword()` in `src/lib/auth.ts` (verify current, min 6 chars, not same as old)
- `POST /api/auth/password` — logged-in users only
- `/account` page — profile + change password form
- Header username → `/account`; mobile menu + admin sidebar link「修改密码」

### Usage
1. 登录后点击顶部用户名，或访问 `/account`
2. 输入当前密码 + 新密码（至少 6 位）并确认
3. 管理员务必改掉默认 `admin123`

## Suggested next
- T25 强制登录 / 订单超时生效
- T26 真实支付 Provider

Repo: https://github.com/fymd/yunmeng-mall
