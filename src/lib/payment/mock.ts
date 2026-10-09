import type {
  CallbackResult,
  CreatePaymentInput,
  PaymentProvider,
  PaymentResult,
} from "./types";

export class MockPaymentProvider implements PaymentProvider {
  name = "mock" as const;

  async createPayment(input: CreatePaymentInput): Promise<PaymentResult> {
    return {
      success: true,
      pending: false,
      paymentId: `mock_${input.orderNo}_${Date.now()}`,
      message: "模拟支付成功",
    };
  }

  async verifyCallback(payload: unknown): Promise<CallbackResult> {
    const p = (payload || {}) as { orderNo?: string };
    return {
      orderNo: String(p.orderNo || ""),
      success: true,
      paymentId: `mock_cb_${Date.now()}`,
    };
  }
}
