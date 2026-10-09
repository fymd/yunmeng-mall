import type {
  AlipayCredentials,
  CallbackResult,
  CreatePaymentInput,
  PaymentProvider,
  PaymentResult,
} from "./types";

/**
 * Alipay provider skeleton.
 * - Without credentials → soft-fail with clear message (does not charge).
 * - With credentials → placeholder that keeps order PENDING and returns a stub payUrl.
 * Wire real SDK (e.g. alipay-sdk) inside createPayment / verifyCallback later.
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

  async createPayment(input: CreatePaymentInput): Promise<PaymentResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        pending: false,
        message:
          "支付宝未配置完整（需要 alipay_app_id / private_key / public_key）。请在后台填写或改回 mock。",
      };
    }

    // TODO: call Alipay page/wap pay API, sign with privateKey, return real form/URL.
    const notify = this.creds.notifyUrl || "/api/payment/alipay/notify";
    const stubPayUrl = `/api/payment/alipay/stub-pay?orderNo=${encodeURIComponent(input.orderNo)}&amount=${input.amount}`;

    return {
      success: false,
      pending: true,
      paymentId: `alipay_pending_${input.orderNo}`,
      payUrl: stubPayUrl,
      message: `支付宝骨架：订单保持待支付。配置已识别 AppId=${this.creds.appId.slice(0, 6)}… 回调=${notify}。请接入官方 SDK 后替换 createPayment。`,
    };
  }

  async verifyCallback(payload: unknown): Promise<CallbackResult> {
    // TODO: verify sign with alipay public key; parse out_trade_no / trade_status
    const p = (payload || {}) as Record<string, string>;
    const orderNo = String(
      p.out_trade_no || p.orderNo || p.outTradeNo || ""
    );
    const tradeStatus = String(p.trade_status || p.tradeStatus || "");
    const success =
      tradeStatus === "TRADE_SUCCESS" ||
      tradeStatus === "TRADE_FINISHED" ||
      p.success === "true" ||
      p.success === "1";

    if (!orderNo) {
      return { orderNo: "", success: false, raw: payload };
    }

    // Skeleton: if caller marks success explicitly, accept; otherwise reject unsigned payloads
    if (!this.isConfigured()) {
      return { orderNo, success: false, raw: payload };
    }

    return {
      orderNo,
      success,
      paymentId: p.trade_no || p.tradeNo,
      raw: payload,
    };
  }
}
