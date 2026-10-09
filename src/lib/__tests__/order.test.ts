import { describe, it, expect } from "vitest";
import {
  generateOrderNo,
  isOrderNoFormat,
  isValidOrderStatus,
  ORDER_STATUSES,
  ORDER_STATUS_LABEL,
} from "../order";

describe("generateOrderNo", () => {
  it("starts with YM and has expected length", () => {
    const no = generateOrderNo(new Date("2026-10-10T12:30:45"));
    expect(no.startsWith("YM")).toBe(true);
    expect(no.length).toBe(20); // YM + 14 digits datetime + 4 random
    expect(isOrderNoFormat(no)).toBe(true);
  });

  it("embeds the provided date", () => {
    const no = generateOrderNo(new Date("2026-03-15T08:09:10"));
    expect(no).toMatch(/^YM20260315080910\d{4}$/);
  });

  it("produces unique values across calls", () => {
    const set = new Set(
      Array.from({ length: 50 }, () => generateOrderNo())
    );
    // high probability of uniqueness; allow rare collision
    expect(set.size).toBeGreaterThan(40);
  });
});

describe("isValidOrderStatus", () => {
  it("accepts all defined statuses", () => {
    for (const s of ORDER_STATUSES) {
      expect(isValidOrderStatus(s)).toBe(true);
      expect(ORDER_STATUS_LABEL[s]).toBeTruthy();
    }
  });

  it("rejects unknown statuses", () => {
    expect(isValidOrderStatus("SHIPPED")).toBe(false);
    expect(isValidOrderStatus("")).toBe(false);
    expect(isValidOrderStatus("paid")).toBe(false);
  });
});

describe("isOrderNoFormat", () => {
  it("rejects invalid formats", () => {
    expect(isOrderNoFormat("YM123")).toBe(false);
    expect(isOrderNoFormat("ORDER1234567890123456")).toBe(false);
    expect(isOrderNoFormat("")).toBe(false);
  });
});
