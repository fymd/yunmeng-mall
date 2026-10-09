# Payment — 真实支付接入说明

## 模式

| `payment_mode` | 行为 |
|----------------|------|
| `mock` | 立即标记已支付（演示） |
| `alipay` | **电脑网站支付** `alipay.trade.page.pay`，RSA2 签名 + 异步通知验签 |
| `wechat` | **Native 扫码** 统一下单 V2，MD5 签名 + 通知验签 |

在后台「站点配置」填写密钥，或写入环境变量 / Config 表。

## 支付宝必填

| 配置键 | 说明 |
|--------|------|
| `alipay_app_id` | 应用 APPID |
| `alipay_private_key` | 应用私钥（PKCS#1 或 PKCS#8 PEM，可无头尾） |
| `alipay_public_key` | **支付宝公钥**（不是应用公钥） |
| `alipay_notify_url` | `https://你的域名/api/payment/alipay/notify` |

沙箱：可设环境变量 `ALIPAY_SANDBOX=1`，或使用沙箱 APPID（9021 开头会自动走沙箱网关）。

下单后返回 `payUrl`（支付宝网关带签参数），用户浏览器打开完成支付。

## 微信必填

| 配置键 | 说明 |
|--------|------|
| `wechat_app_id` | 公众号/应用 AppID |
| `wechat_mch_id` | 商户号 |
| `wechat_api_key` | API 密钥（V2） |
| `wechat_notify_url` | `https://你的域名/api/payment/wechat/notify` |

可选：`WECHAT_SPBILL_IP` 为服务器出口 IP（默认 `127.0.0.1`，生产请改成真实 IP）。

下单成功后 `payUrl` 指向 `/api/payment/wechat/qr`，展示 `code_url` 二维码并轮询订单状态。

## 安全

- 回调必须验签通过才 `markOrderPaid`
- 密钥仅服务端 Config / 环境变量，不进前端
- 通知 URL 必须 **HTTPS 公网**

## 代码

```
src/lib/payment/
  alipay.ts      # page.pay + RSA2 verify
  wechat.ts      # unifiedorder + MD5 verify
  crypto-util.ts # sign helpers
  mark-paid.ts
```

## 常见问题

1. **签名失败**：检查私钥是否为应用私钥、是否复制完整。  
2. **通知不到**：域名、HTTPS、防火墙、支付宝/微信商户平台是否配置同一 notify URL。  
3. **仍想演示**：支付模式改回 `mock`。
