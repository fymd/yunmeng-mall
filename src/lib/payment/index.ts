/**
 * Payment module public API.
 * Mode is driven by Config `payment_mode` or PAYMENT_MODE env.
 */

export type {
  AlipayCredentials,
  CallbackResult,
  CreatePaymentInput,
  PaymentMode,
  PaymentProvider,
  PaymentResult,
  WechatCredentials,
} from "./types";

export { MockPaymentProvider } from "./mock";
export { AlipayPaymentProvider } from "./alipay";
export { WechatPaymentProvider } from "./wechat";
export {
  getPaymentProvider,
  normalizePaymentMode,
  resolvePaymentProvider,
} from "./resolve";
export { markOrderPaidByOrderNo } from "./mark-paid";
export {
  alipaySignRsa2,
  alipayVerifyRsa2,
  wechatSignMd5,
  wechatVerifyMd5,
  buildKeyValueContent,
} from "./crypto-util";
