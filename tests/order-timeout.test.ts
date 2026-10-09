import { describe, expect, it } from "vitest";
import {
  isPendingOrderExpired,
  parseOrderTimeoutMinutes,
  timeoutCancelRemark,
} from "../src/lib/order";

describe("parseOrderTimeoutMinutes", () => {
  it("parses positive integers", () => {
    expect(parseOrderTimeoutMinutes("30")).toBe(30);
    expect(parseOrderTimeoutMinutes("1")).toBe(1);
  });

  it("disables on 0 / invalid", () => {
    expect(parseOrderTimeoutMinutes("0")).toBe(0);
    expect(parseOrderTimeoutMinutes("")).toBe(0);
    expect(parseOrderTimeoutMinutes(undefined)).toBe(0);
    expect(parseOrderTimeoutMinutes("abc")).toBe(0);
    expect(parseOrderTimeoutMinutes("-5")).toBe(0);
  });
});

describe("isPendingOrderExpired", () => {
  const created = new Date("2026-01-01T12:00:00Z");

  it("not expired within window", () => {
    const now = new Date("2026-01-01T12:10:00Z");
    expect(isPendingOrderExpired(created, 30, now)).toBe(false);
  });

  it("expired after window", () => {
    const now = new Date("2026-01-01T12:31:00Z");
    expect(isPendingOrderExpired(created, 30, now)).toBe(true);
  });

  it("never expires when timeout is 0", () => {
    const now = new Date("2026-01-02T12:00:00Z");
    expect(isPendingOrderExpired(created, 0, now)).toBe(false);
  });
});

describe("timeoutCancelRemark", () => {
  it("appends system note", () => {
    expect(timeoutCancelRemark("邮箱 x", 30)).toContain("[系统]");
    expect(timeoutCancelRemark("", 15)).toMatch(/15 分钟/);
  });

  it("does not duplicate system note", () => {
    const once = timeoutCancelRemark("", 30);
    expect(timeoutCancelRemark(once, 30)).toBe(once);
  });
});
