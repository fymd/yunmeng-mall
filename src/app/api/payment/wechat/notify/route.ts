import { NextRequest, NextResponse } from "next/server";
import { resolvePaymentProvider } from "@/lib/payment";
import { markOrderPaidByOrderNo } from "@/lib/payment/mark-paid";

/**
 * POST /api/payment/wechat/notify
 * WeChat Pay notify skeleton. Production should parse XML and verify sign.
 */
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let payload: Record<string, string> = {};

    if (contentType.includes("application/json")) {
      payload = (await req.json()) as Record<string, string>;
    } else if (contentType.includes("xml") || contentType.includes("text")) {
      const text = await req.text();
      // Minimal tag scrape for skeleton testing — replace with proper XML parser
      const grab = (tag: string) => {
        const m = text.match(new RegExp(`<${tag}><!\\[CDATA\\[(.*?)\\]\\]></${tag}>|<${tag}>(.*?)</${tag}>`));
        return m ? (m[1] ?? m[2] ?? "") : "";
      };
      payload = {
        out_trade_no: grab("out_trade_no"),
        result_code: grab("result_code"),
        return_code: grab("return_code"),
        transaction_id: grab("transaction_id"),
      };
    } else {
      try {
        const form = await req.formData();
        form.forEach((v, k) => {
          payload[k] = String(v);
        });
      } catch {
        payload = {};
      }
    }

    const provider = await resolvePaymentProvider("wechat");
    const verified = await provider.verifyCallback(payload);

    if (!verified.orderNo || !verified.success) {
      console.warn("[wechat notify] rejected", verified);
      return new NextResponse(
        "<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[INVALID]]></return_msg></xml>",
        { status: 400, headers: { "Content-Type": "application/xml" } }
      );
    }

    await markOrderPaidByOrderNo(verified.orderNo, {
      paymentId: verified.paymentId,
      appendRemark: "[系统] 微信支付回调确认支付",
    });

    return new NextResponse(
      "<xml><return_code><![CDATA[SUCCESS]]></return_code><return_msg><![CDATA[OK]]></return_msg></xml>",
      { status: 200, headers: { "Content-Type": "application/xml" } }
    );
  } catch (e) {
    console.error("[wechat notify]", e);
    return new NextResponse(
      "<xml><return_code><![CDATA[FAIL]]></return_code></xml>",
      { status: 500, headers: { "Content-Type": "application/xml" } }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: "wechat notify",
    status: "skeleton",
    hint: "POST notify from WeChat; implement signature verify in WechatPaymentProvider",
  });
}
