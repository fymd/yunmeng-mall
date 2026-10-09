# Payment providers — 支付接入说明

## 模式切换

后台 **站点配置 → 支付模式**，或环境变量 `PAYMENT_MODE`：

| 模式 | 行为 |
|------|------|
| `mock` | 下单立即「已支付」（默认，演示用） |
| `alipay` | 支付宝骨架：缺密钥则下单失败；密钥齐全则订单「待支付」并返回 `payUrl` |
| `wechat` | 微信骨架：同上 |

配置项：`alipay_*` / `wechat_*`（见后台表单，敏感字段脱敏）。

## 代码结构

```
src/lib/payment/
  types.ts      # 接口
  mock.ts       # 模拟
  alipay.ts     # 支付宝骨架（待接 SDK）
  wechat.ts     # 微信骨架（待接 SDK）
  resolve.ts    # 读配置构造 Provider
  mark-paid.ts  # 回调标记已支付
  index.ts
```

回调路由：

- `POST /api/payment/alipay/notify`
- `POST /api/payment/wechat/notify`

开发占位页（非真实扣款）：

- `/api/payment/alipay/stub-pay`
- `/api/payment/wechat/stub-pay`

## 接入真实 SDK 时

1. 在 `AlipayPaymentProvider.createPayment` 调用官方下单，返回真实收银台 URL。
2. 在 `verifyCallback` 验签，确认 `TRADE_SUCCESS` 后由 notify 路由调用 `markOrderPaidByOrderNo`。
3. 微信同理：统一下单 + 通知验签。
4. 保持 `payment_mode` 与密钥仅存 Config / 环境变量，勿写入前端。

## 与订单超时

真实支付下订单会停留在 **PENDING**，`order_timeout_minutes` 会在查询时自动取消超时未支付订单。
