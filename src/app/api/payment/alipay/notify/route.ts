import { NextRequest, NextResponse } from "next/server";
import { resolvePaymentProvider } from "@/lib/payment";
import { markOrderPaidByOrderNo } from "@/lib/payment/mark-paid";

/**
 * POST /api/payment/alipay/notify — Alipay async notify (form body)
 */
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let payload: Record<string, string> = {};

    if (contentType.includes("application/json")) {
      payload = (await req.json()) as Record<string, string>;
    } else {
      const form = await req.formData();
      form.forEach((v, k) => {
        payload[k] = String(v);
      });
    }

    const provider = await resolvePaymentProvider("alipay");
    const verified = await provider.verifyCallback(payload);

    if (!verified.orderNo || !verified.success) {
      console.warn("[alipay notify] rejected", verified);
      return new NextResponse("fail", { status: 400 });
    }

    const result = await markOrderPaidByOrderNo(verified.orderNo, {
      paymentId: verified.paymentId,
      appendRemark: "[系统] 支付宝回调确认支付",
    });

    if (!result.ok && result.reason === "order not found") {
      return new NextResponse("fail", { status: 404 });
    }

    // Alipay expects plain text "success"
    return new NextResponse("success", { status: 200 });
  } catch (e) {
    console.error("[alipay notify]", e);
    return new NextResponse("fail", { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: "alipay notify",
    status: "live",
    hint: "Alipay posts form fields here after payment",
  });
}
