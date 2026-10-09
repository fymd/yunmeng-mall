import { describe, it, expect } from "vitest";
import { getPaymentProvider, MockPaymentProvider } from "../payment";

describe("MockPaymentProvider", () => {
  it("always succeeds and returns paymentId", async () => {
    const provider = new MockPaymentProvider();
    const result = await provider.createPayment({
      orderNo: "YM202610101200001234",
      amount: 99.9,
      subject: "测试商品",
      userId: "user_1",
    });
    expect(result.success).toBe(true);
    expect(result.paymentId).toContain("mock_YM202610101200001234");
    expect(result.message).toContain("模拟");
  });
});

describe("getPaymentProvider", () => {
  it("returns mock for empty / mock / unknown mode", () => {
    expect(getPaymentProvider().name).toBe("mock");
    expect(getPaymentProvider("mock").name).toBe("mock");
    expect(getPaymentProvider("MOCK").name).toBe("mock");
    expect(getPaymentProvider("alipay").name).toBe("mock"); // not implemented yet
    expect(getPaymentProvider("wechat").name).toBe("mock");
  });
});
