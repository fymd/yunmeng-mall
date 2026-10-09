import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const orderNo = req.nextUrl.searchParams.get("orderNo") || "";
  const amount = req.nextUrl.searchParams.get("amount") || "";
  const html = `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"/><title>微信支付骨架</title></head>
<body style="font-family:system-ui;padding:2rem;max-width:32rem;margin:auto">
<h1>微信支付骨架</h1>
<p>订单号：<code>${escapeHtml(orderNo)}</code></p>
<p>金额：¥${escapeHtml(amount)}</p>
<p>此页面仅表示 <code>WechatPaymentProvider</code> 已识别到配置。请接入官方统一下单接口。</p>
<p>异步回调地址：<code>/api/payment/wechat/notify</code></p>
<p><a href="/orders?orderNo=${encodeURIComponent(orderNo)}">查看订单</a></p>
</body></html>`;
  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
