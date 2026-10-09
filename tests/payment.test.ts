import { describe, expect, it } from "vitest";
import {
  AlipayPaymentProvider,
  getPaymentProvider,
  MockPaymentProvider,
  normalizePaymentMode,
  WechatPaymentProvider,
} from "../src/lib/payment";

describe("normalizePaymentMode", () => {
  it("defaults to mock", () => {
    expect(normalizePaymentMode(undefined)).toBe("mock");
    expect(normalizePaymentMode("weird")).toBe("mock");
  });

  it("accepts alipay/wechat", () => {
    expect(normalizePaymentMode("alipay")).toBe("alipay");
    expect(normalizePaymentMode("WECHAT")).toBe("wechat");
  });
});

describe("getPaymentProvider", () => {
  it("returns mock by default", () => {
    expect(getPaymentProvider()).toBeInstanceOf(MockPaymentProvider);
  });

  it("returns alipay/wechat classes", () => {
    expect(getPaymentProvider("alipay")).toBeInstanceOf(AlipayPaymentProvider);
    expect(getPaymentProvider("wechat")).toBeInstanceOf(WechatPaymentProvider);
  });
});

describe("MockPaymentProvider", () => {
  it("succeeds immediately", async () => {
    const p = new MockPaymentProvider();
    const r = await p.createPayment({
      orderNo: "YM1",
      amount: 10,
      subject: "t",
    });
    expect(r.success).toBe(true);
    expect(r.paymentId).toBeTruthy();
  });
});

describe("AlipayPaymentProvider skeleton", () => {
  it("fails clearly when not configured", async () => {
    const p = new AlipayPaymentProvider({
      appId: "",
      privateKey: "",
      publicKey: "",
      notifyUrl: "",
    });
    const r = await p.createPayment({
      orderNo: "YM1",
      amount: 1,
      subject: "x",
    });
    expect(r.success).toBe(false);
    expect(r.pending).toBe(false);
    expect(r.message).toMatch(/未配置/);
  });

  it("returns pending + payUrl when configured", async () => {
    const p = new AlipayPaymentProvider({
      appId: "2021000000",
      privateKey: "KEY",
      publicKey: "PUB",
      notifyUrl: "https://example.com/api/payment/alipay/notify",
    });
    const r = await p.createPayment({
      orderNo: "YM2",
      amount: 9.9,
      subject: "x",
    });
    expect(r.success).toBe(false);
    expect(r.pending).toBe(true);
    expect(r.payUrl).toContain("orderNo=YM2");
  });
});

describe("WechatPaymentProvider skeleton", () => {
  it("fails when not configured", async () => {
    const p = new WechatPaymentProvider({
      appId: "",
      mchId: "",
      apiKey: "",
      notifyUrl: "",
    });
    const r = await p.createPayment({
      orderNo: "YM3",
      amount: 1,
      subject: "x",
    });
    expect(r.success).toBe(false);
    expect(r.message).toMatch(/未配置/);
  });
});
