import { createSign, generateKeyPairSync } from "crypto";
import { describe, expect, it } from "vitest";
import {
  alipaySignRsa2,
  alipayVerifyRsa2,
  buildKeyValueContent,
  wechatSignMd5,
  wechatVerifyMd5,
} from "../src/lib/payment/crypto-util";

describe("buildKeyValueContent", () => {
  it("sorts and skips empty", () => {
    expect(buildKeyValueContent({ b: "2", a: "1", c: "" })).toBe("a=1&b=2");
  });
});

describe("wechatSignMd5", () => {
  it("matches known vector style", () => {
    const params = {
      appid: "wx123",
      mch_id: "100",
      nonce_str: "abc",
    };
    const sign = wechatSignMd5(params, "key123");
    expect(sign).toMatch(/^[A-F0-9]{32}$/);
    expect(wechatVerifyMd5({ ...params, sign }, "key123")).toBe(true);
    expect(wechatVerifyMd5({ ...params, sign }, "wrong")).toBe(false);
  });
});

describe("alipay RSA2", () => {
  it("sign and verify roundtrip", () => {
    const { privateKey, publicKey } = generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicKeyEncoding: { type: "spki", format: "pem" },
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
    });

    const params = {
      app_id: "2021001",
      method: "alipay.trade.page.pay",
      charset: "utf-8",
      sign_type: "RSA2",
      biz_content: '{"out_trade_no":"YM1"}',
    };

    const sign = alipaySignRsa2(params, privateKey);
    expect(sign.length).toBeGreaterThan(20);
    expect(alipayVerifyRsa2({ ...params, sign }, publicKey)).toBe(true);

    // tamper
    expect(
      alipayVerifyRsa2({ ...params, sign, app_id: "x" }, publicKey)
    ).toBe(false);
  });
});
