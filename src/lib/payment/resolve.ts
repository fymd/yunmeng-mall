import { getConfig } from "@/lib/config";
import { AlipayPaymentProvider } from "./alipay";
import { MockPaymentProvider } from "./mock";
import type { PaymentMode, PaymentProvider } from "./types";
import { WechatPaymentProvider } from "./wechat";

export function normalizePaymentMode(mode?: string | null): PaymentMode {
  const m = (mode || process.env.PAYMENT_MODE || "mock").toLowerCase().trim();
  if (m === "alipay" || m === "wechat" || m === "mock") return m;
  return "mock";
}

/** Sync factory when credentials already loaded (tests / simple use). */
export function getPaymentProvider(
  mode?: string,
  options?: {
    alipay?: {
      appId: string;
      privateKey: string;
      publicKey: string;
      notifyUrl: string;
    };
    wechat?: {
      appId: string;
      mchId: string;
      apiKey: string;
      notifyUrl: string;
    };
  }
): PaymentProvider {
  const m = normalizePaymentMode(mode);
  switch (m) {
    case "alipay":
      return new AlipayPaymentProvider({
        appId: options?.alipay?.appId || "",
        privateKey: options?.alipay?.privateKey || "",
        publicKey: options?.alipay?.publicKey || "",
        notifyUrl: options?.alipay?.notifyUrl || "",
      });
    case "wechat":
      return new WechatPaymentProvider({
        appId: options?.wechat?.appId || "",
        mchId: options?.wechat?.mchId || "",
        apiKey: options?.wechat?.apiKey || "",
        notifyUrl: options?.wechat?.notifyUrl || "",
      });
    case "mock":
    default:
      return new MockPaymentProvider();
  }
}

/** Load credentials from Config table + env, then build provider. */
export async function resolvePaymentProvider(
  modeOverride?: string
): Promise<PaymentProvider> {
  const mode = normalizePaymentMode(
    modeOverride ?? (await getConfig("payment_mode"))
  );

  if (mode === "alipay") {
    return new AlipayPaymentProvider({
      appId: await getConfig("alipay_app_id"),
      privateKey: await getConfig("alipay_private_key"),
      publicKey: await getConfig("alipay_public_key"),
      notifyUrl: await getConfig("alipay_notify_url"),
    });
  }

  if (mode === "wechat") {
    return new WechatPaymentProvider({
      appId: await getConfig("wechat_app_id"),
      mchId: await getConfig("wechat_mch_id"),
      apiKey: await getConfig("wechat_api_key"),
      notifyUrl: await getConfig("wechat_notify_url"),
    });
  }

  return new MockPaymentProvider();
}
