/**
 * Payment Provider abstraction.
 * Switch via PAYMENT_MODE env or Config table.
 * MVP uses MockPaymentProvider.
 */

export interface CreatePaymentInput {
  orderNo: string;
  amount: number;
  subject: string;
  userId?: string;
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  payUrl?: string;
  message?: string;
}

export interface PaymentProvider {
  name: string;
  createPayment(input: CreatePaymentInput): Promise<PaymentResult>;
  verifyCallback?(payload: unknown): Promise<{ orderNo: string; success: boolean }>;
}

export class MockPaymentProvider implements PaymentProvider {
  name = "mock";

  async createPayment(input: CreatePaymentInput): Promise<PaymentResult> {
    return {
      success: true,
      paymentId: `mock_${input.orderNo}_${Date.now()}`,
      message: "模拟支付成功",
    };
  }

  async verifyCallback(): Promise<{ orderNo: string; success: boolean }> {
    return { orderNo: "", success: true };
  }
}

export function getPaymentProvider(mode?: string): PaymentProvider {
  const m = (mode || process.env.PAYMENT_MODE || "mock").toLowerCase();
  switch (m) {
    case "mock":
    default:
      return new MockPaymentProvider();
  }
}
