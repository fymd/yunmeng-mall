import { NextRequest, NextResponse } from "next/server";
import { getPaymentProvider } from "@/lib/payment";
import { getConfig } from "@/lib/config";

/**
 * POST /api/payment/mock
 * Body: { orderNo, amount, subject, userId }
 * Uses the configured payment provider (currently Mock).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderNo, amount, subject, userId } = body as {
      orderNo?: string;
      amount?: number;
      subject?: string;
      userId?: string;
    };

    if (!orderNo || amount == null || !subject || !userId) {
      return NextResponse.json(
        { error: "orderNo, amount, subject, userId required" },
        { status: 400 }
      );
    }

    const mode = await getConfig("payment_mode");
    const provider = getPaymentProvider(mode);
    const result = await provider.createPayment({
      orderNo,
      amount: Number(amount),
      subject,
      userId,
    });

    return NextResponse.json({
      provider: provider.name,
      ...result,
    });
  } catch (e) {
    console.error("payment mock error", e);
    return NextResponse.json(
      { error: "Payment failed", message: String(e) },
      { status: 500 }
    );
  }
}
