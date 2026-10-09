# Development Progress — 云梦AI代充商城

## Current Status

**T27 Real payment providers**: ✅ DONE  
**Last Update**: 2026-10-10 04:55 JST

## Post-MVP
- [x] T23–T26
- [x] **T27 真实支付宝 / 微信对接**

### T27 Features
- Alipay: `alipay.trade.page.pay` + RSA2 sign/verify notify
- WeChat: Native unifiedorder V2 + MD5 sign/verify + QR page
- Requires public HTTPS notify URLs
- Tests: `tests/payment-crypto.test.ts`
- Docs: `docs/payment.md`

Repo: https://github.com/fymd/yunmeng-mall
