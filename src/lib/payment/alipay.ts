import {
  alipaySignRsa2,
  alipayVerifyRsa2,
} from "./crypto-util";
import type {
  AlipayCredentials,
  CallbackResult,
  CreatePaymentInput,
  PaymentProvider,
  PaymentResult,
} from "./types";

const GATEWAY_PROD = "https://openapi.alipay.com/gateway.do";
const GATEWAY_SANDBOX = "https://openapi-sandbox.dl.alipaydev.com/gateway.do";

function isSandboxAppId(appId: string): boolean {
  return appId.startsWith("9021") || process.env.ALIPAY_SANDBOX === "1";
}

/**
 * Alipay computer website pay (alipay.trade.page.pay).
 */
export class AlipayPaymentProvider implements PaymentProvider {
  name = "alipay" as const;

  constructor(private readonly creds: AlipayCredentials) {}

  isConfigured(): boolean {
    return Boolean(
      this.creds.appId?.trim() &&
        this.creds.privateKey?.trim() &&
        this.creds.publicKey?.trim()
    );
  }

  private gateway(): string {
    return isSandboxAppId(this.creds.appId) ? GATEWAY_SANDBOX : GATEWAY_PROD;
  }

  async createPayment(input: CreatePaymentInput): Promise<PaymentResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        pending: false,
        message:
          "支付宝未配置完整（需要 alipay_app_id / private_key / public_key）。请在后台填写或改回 mock。",
      };
    }

    const notifyUrl = (this.creds.notifyUrl || "").trim();
    if (!notifyUrl.startsWith("http")) {
      return {
        success: false,
        pending: false,
        message:
          "请配置公网可访问的 alipay_notify_url（例如 https://你的域名/api/payment/alipay/notify）",
      };
    }

    // Sync return after user pays in browser → payment result page
    const siteBase =
      process.env.NEXTAUTH_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "";
    const returnUrl = siteBase
      ? `${siteBase.replace(/\/$/, "")}/pay/result?orderNo=${encodeURIComponent(input.orderNo)}`
      : "";

    const bizContent = JSON.stringify({
      out_trade_no: input.orderNo,
      product_code: "FAST_INSTANT_TRADE_PAY",
      total_amount: Number(input.amount).toFixed(2),
      subject: String(input.subject).slice(0, 256),
    });

    const params: Record<string, string> = {
      app_id: this.creds.appId.trim(),
      method: "alipay.trade.page.pay",
      format: "JSON",
      charset: "utf-8",
      sign_type: "RSA2",
      timestamp: formatAlipayTimestamp(new Date()),
      version: "1.0",
      notify_url: notifyUrl,
      biz_content: bizContent,
    };
    if (returnUrl) {
      params.return_url = returnUrl;
    }

    try {
      params.sign = alipaySignRsa2(params, this.creds.privateKey);
    } catch (e) {
      return {
        success: false,
        pending: false,
        message: `支付宝私钥签名失败，请检查 PEM 格式: ${String(e)}`,
      };
    }

    const qs = Object.keys(params)
      .map(
        (k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`
      )
      .join("&");
    const payUrl = `${this.gateway()}?${qs}`;

    return {
      success: false,
      pending: true,
      paymentId: `alipay_${input.orderNo}`,
      payUrl,
      message: "请跳转支付宝完成支付；支付成功后将异步通知本站",
    };
  }

  async verifyCallback(payload: unknown): Promise<CallbackResult> {
    const p = flattenPayload(payload);
    const orderNo = String(p.out_trade_no || "");
    if (!orderNo || !this.isConfigured()) {
      return { orderNo, success: false, raw: payload };
    }

    const signOk = alipayVerifyRsa2(p, this.creds.publicKey);
    if (!signOk) {
      console.warn("[alipay] notify sign verify failed");
      return { orderNo, success: false, raw: payload };
    }

    const tradeStatus = String(p.trade_status || "");
    const success =
      tradeStatus === "TRADE_SUCCESS" || tradeStatus === "TRADE_FINISHED";

    return {
      orderNo,
      success,
      paymentId: p.trade_no,
      raw: payload,
    };
  }
}

function formatAlipayTimestamp(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  );
}

function flattenPayload(payload: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (!payload || typeof payload !== "object") return out;
  for (const [k, v] of Object.entries(payload as Record<string, unknown>)) {
    if (v === undefined || v === null) continue;
    out[k] = String(v);
  }
  return out;
}
