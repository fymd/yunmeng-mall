import {
  fromXml,
  randomNonceStr,
  toXml,
  wechatSignMd5,
  wechatVerifyMd5,
} from "./crypto-util";
import type {
  CallbackResult,
  CreatePaymentInput,
  PaymentProvider,
  PaymentResult,
  WechatCredentials,
} from "./types";

const UNIFIED_ORDER_URL = "https://api.mch.weixin.qq.com/pay/unifiedorder";

/**
 * WeChat Pay Native (扫码) via V2 unifiedorder.
 * Returns code_url; frontend/pay page can render QR.
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

    const notifyUrl = (this.creds.notifyUrl || "").trim();
    if (!notifyUrl.startsWith("http")) {
      return {
        success: false,
        pending: false,
        message:
          "请配置公网可访问的 wechat_notify_url（例如 https://你的域名/api/payment/wechat/notify）",
      };
    }

    // WeChat amount is integer fen
    const totalFee = Math.round(Number(input.amount) * 100);
    if (!Number.isFinite(totalFee) || totalFee < 1) {
      return {
        success: false,
        pending: false,
        message: "支付金额无效（微信最小 0.01 元）",
      };
    }

    const params: Record<string, string> = {
      appid: this.creds.appId.trim(),
      mch_id: this.creds.mchId.trim(),
      nonce_str: randomNonceStr(32),
      body: String(input.subject).slice(0, 120),
      out_trade_no: input.orderNo,
      total_fee: String(totalFee),
      spbill_create_ip: process.env.WECHAT_SPBILL_IP || "127.0.0.1",
      notify_url: notifyUrl,
      trade_type: "NATIVE",
    };
    params.sign = wechatSignMd5(params, this.creds.apiKey.trim());

    try {
      const xml = toXml(params);
      const res = await fetch(UNIFIED_ORDER_URL, {
        method: "POST",
        headers: { "Content-Type": "text/xml; charset=utf-8" },
        body: xml,
      });
      const text = await res.text();
      const data = fromXml(text);

      if (data.return_code !== "SUCCESS") {
        return {
          success: false,
          pending: false,
          message: `微信通信失败: ${data.return_msg || text.slice(0, 200)}`,
        };
      }
      if (data.result_code !== "SUCCESS") {
        return {
          success: false,
          pending: false,
          message: `微信下单失败: ${data.err_code || ""} ${data.err_code_des || data.return_msg || ""}`,
        };
      }

      const codeUrl = data.code_url;
      if (!codeUrl) {
        return {
          success: false,
          pending: false,
          message: "微信未返回 code_url",
        };
      }

      // Local page shows QR from code_url
      const payUrl =
        `/api/payment/wechat/qr?orderNo=${encodeURIComponent(input.orderNo)}` +
        `&codeUrl=${encodeURIComponent(codeUrl)}` +
        `&amount=${encodeURIComponent(String(input.amount))}`;

      return {
        success: false,
        pending: true,
        paymentId: data.prepay_id || `wechat_${input.orderNo}`,
        payUrl,
        message: "请使用微信扫码完成支付",
      };
    } catch (e) {
      return {
        success: false,
        pending: false,
        message: `调用微信统一下单异常: ${String(e)}`,
      };
    }
  }

  async verifyCallback(payload: unknown): Promise<CallbackResult> {
    const p =
      typeof payload === "string"
        ? fromXml(payload)
        : flatten(payload);

    const orderNo = String(p.out_trade_no || "");
    if (!orderNo || !this.isConfigured()) {
      return { orderNo, success: false, raw: payload };
    }

    if (!wechatVerifyMd5(p, this.creds.apiKey.trim())) {
      console.warn("[wechat] notify sign verify failed");
      return { orderNo, success: false, raw: payload };
    }

    const success =
      p.return_code === "SUCCESS" && p.result_code === "SUCCESS";

    return {
      orderNo,
      success,
      paymentId: p.transaction_id,
      raw: p,
    };
  }
}

function flatten(payload: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (!payload || typeof payload !== "object") return out;
  for (const [k, v] of Object.entries(payload as Record<string, unknown>)) {
    if (v === undefined || v === null) continue;
    out[k] = String(v);
  }
  return out;
}
