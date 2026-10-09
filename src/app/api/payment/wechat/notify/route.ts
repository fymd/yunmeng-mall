import { NextRequest, NextResponse } from "next/server";
import { resolvePaymentProvider } from "@/lib/payment";
import { markOrderPaidByOrderNo } from "@/lib/payment/mark-paid";
import { fromXml } from "@/lib/payment/crypto-util";

function xmlReply(ok: boolean, msg = "OK") {
  if (ok) {
    return new NextResponse(
      "<xml><return_code><![CDATA[SUCCESS]]></return_code><return_msg><![CDATA[OK]]></return_msg></xml>",
      { status: 200, headers: { "Content-Type": "application/xml" } }
    );
  }
  return new NextResponse(
    `<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[${msg}]]></return_msg></xml>`,
    { status: 400, headers: { "Content-Type": "application/xml" } }
  );
}

/**
 * POST /api/payment/wechat/notify — WeChat Pay V2 async notify
 */
export async function POST(req: NextRequest) {
  try {
    const text = await req.text();
    const payload = text.includes("<") ? fromXml(text) : {};

    // Also merge JSON if any
    if (!payload.out_trade_no) {
      try {
        const j = JSON.parse(text) as Record<string, string>;
        Object.assign(payload, j);
      } catch {
        /* ignore */
      }
    }

    const provider = await resolvePaymentProvider("wechat");
    const verified = await provider.verifyCallback(
      text.includes("<") ? text : payload
    );

    if (!verified.orderNo || !verified.success) {
      console.warn("[wechat notify] rejected", verified);
      return xmlReply(false, "INVALID");
    }

    await markOrderPaidByOrderNo(verified.orderNo, {
      paymentId: verified.paymentId,
      appendRemark: "[系统] 微信支付回调确认支付",
    });

    return xmlReply(true);
  } catch (e) {
    console.error("[wechat notify]", e);
    return xmlReply(false, "ERROR");
  }
}

export async function GET() {
  return Response.json({
    endpoint: "wechat notify",
    status: "live",
    hint: "WeChat posts XML here after payment",
  });
}
