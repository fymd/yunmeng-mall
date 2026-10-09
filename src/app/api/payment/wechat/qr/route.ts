import { NextRequest, NextResponse } from "next/server";

/**
 * Simple QR landing page for WeChat Native code_url.
 * Uses a public QR image API for display only (code_url is weixin:// or https URL from WeChat).
 */
export async function GET(req: NextRequest) {
  const orderNo = req.nextUrl.searchParams.get("orderNo") || "";
  const codeUrl = req.nextUrl.searchParams.get("codeUrl") || "";
  const amount = req.nextUrl.searchParams.get("amount") || "";

  if (!codeUrl) {
    return new NextResponse("missing codeUrl", { status: 400 });
  }

  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(codeUrl)}`;

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>微信扫码支付</title>
  <style>
    body{font-family:system-ui,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0;background:#f5f5f5}
    .card{background:#fff;border-radius:16px;padding:2rem;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,.08);max-width:20rem}
    img{border-radius:8px}
    .amt{font-size:1.5rem;font-weight:700;color:#16a34a;margin:.5rem 0}
    a{color:#4f46e5;font-size:.875rem}
  </style>
</head>
<body>
  <div class="card">
    <h1 style="font-size:1.125rem;margin:0 0 .5rem">微信扫码支付</h1>
    <p style="color:#6b7280;font-size:.75rem;word-break:break-all">订单 ${escapeHtml(orderNo)}</p>
    <p class="amt">¥${escapeHtml(amount)}</p>
    <img src="${escapeHtml(qrSrc)}" width="220" height="220" alt="支付二维码"/>
    <p style="color:#6b7280;font-size:.75rem;margin-top:1rem">请使用微信扫一扫完成支付</p>
    <p style="margin-top:1rem"><a href="/orders?orderNo=${encodeURIComponent(orderNo)}">支付后查看订单</a></p>
  </div>
  <script>
    // Poll order status every 3s
    (function poll(){
      var no = ${JSON.stringify(orderNo)};
      if (!no) return;
      setInterval(function(){
        fetch("/api/orders?orderNo=" + encodeURIComponent(no))
          .then(function(r){ return r.json(); })
          .then(function(d){
            if (d.order && d.order.status && d.order.status !== "PENDING") {
              location.href = "/orders?orderNo=" + encodeURIComponent(no);
            }
          }).catch(function(){});
      }, 3000);
    })();
  </script>
</body>
</html>`;

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
