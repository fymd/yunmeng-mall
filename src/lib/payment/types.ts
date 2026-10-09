/** Shared payment provider contracts */

export type PaymentMode = "mock" | "alipay" | "wechat";

export interface CreatePaymentInput {
  orderNo: string;
  amount: number;
  subject: string;
  userId?: string;
}

export interface PaymentResult {
  /** Immediate success (e.g. mock). Real gateways usually return false + payUrl. */
  success: boolean;
  paymentId?: string;
  /** Redirect / QR page URL for user to complete payment */
  payUrl?: string;
  message?: string;
  /** Provider reported it needs async notify before marking PAID */
  pending?: boolean;
}

export interface CallbackResult {
  orderNo: string;
  success: boolean;
  paymentId?: string;
  raw?: unknown;
}

export interface PaymentProvider {
  name: PaymentMode | string;
  createPayment(input: CreatePaymentInput): Promise<PaymentResult>;
  verifyCallback(payload: unknown): Promise<CallbackResult>;
}

export interface AlipayCredentials {
  appId: string;
  privateKey: string;
  publicKey: string;
  notifyUrl: string;
}

export interface WechatCredentials {
  appId: string;
  mchId: string;
  apiKey: string;
  notifyUrl: string;
}
