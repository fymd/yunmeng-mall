import type {
  CallbackResult,
  CreatePaymentInput,
  PaymentProvider,
  PaymentResult,
  WechatCredentials,
} from "./types";

/**
 * WeChat Pay provider skeleton (Native / JSAPI placeholder).
 * Credentials missing → soft-fail. Configured → PENDING + stub payUrl.
 */
export class WechatPaymentProvider implements PaymentProvider {
  name = "wechat" as const;

  constructor(private readonly creds: WechatCredentials) {}

  isConfigured(): boolean {
    return Boolean(
      this.creds.appId?.trim() &&
        this.creds.mchId?.trim() &&
        this.creds.apiKey?.trim()
    );
  }

  async createPayment(input: CreatePaymentInput): Promise<PaymentResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        pending: false,
        message:
          "微信支付未配置完整（需要 wechat_app_id / mch_id / api_key）。请在后台填写或改回 mock。",
      };
    }

    // TODO: unified order API, sign with apiKey, return code_url / prepay_id
    const notify = this.creds.notifyUrl || "/api/payment/wechat/notify";
    const stubPayUrl = `/api/payment/wechat/stub-pay?orderNo=${encodeURIComponent(input.orderNo)}&amount=${input.amount}`;

    return {
      success: false,
      pending: true,
      paymentId: `wechat_pending_${input.orderNo}`,
      payUrl: stubPayUrl,
      message: `微信骨架：订单保持待支付。商户=${this.creds.mchId} 回调=${notify}。请接入官方 SDK 后替换 createPayment。`,
    };
  }

  async verifyCallback(payload: unknown): Promise<CallbackResult> {
    // TODO: XML/JSON notify verify signature with apiKey
    const p = (payload || {}) as Record<string, string>;
    const orderNo = String(
      p.out_trade_no || p.orderNo || p.outTradeNo || ""
    );
    const resultCode = String(p.result_code || p.resultCode || "").toUpperCase();
    const returnCode = String(p.return_code || p.returnCode || "").toUpperCase();
    const success =
      (resultCode === "SUCCESS" && returnCode === "SUCCESS") ||
      p.success === "true" ||
      p.success === "1";

    if (!orderNo || !this.isConfigured()) {
      return { orderNo, success: false, raw: payload };
    }

    return {
      orderNo,
      success,
      paymentId: p.transaction_id || p.transactionId,
      raw: payload,
    };
  }
}
