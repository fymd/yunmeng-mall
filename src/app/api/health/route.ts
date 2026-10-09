import { NextResponse } from "next/server";
import { getConfig } from "@/lib/config";
import { getPaymentProvider } from "@/lib/payment";

export async function GET() {
  try {
    const siteName = await getConfig("site_name");
    const paymentMode = await getConfig("payment_mode");
    const provider = getPaymentProvider(paymentMode);

    return NextResponse.json({
      ok: true,
      site_name: siteName,
      payment_mode: paymentMode,
      payment_provider: provider.name,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: String(e),
        note: "Database may not be initialized. Run: npx prisma db push && npm run db:seed",
      },
      { status: 503 }
    );
  }
}
