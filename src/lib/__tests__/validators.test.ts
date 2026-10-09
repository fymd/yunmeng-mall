import { describe, it, expect } from "vitest";
import {
  isNonEmptyString,
  isPositiveNumber,
  parsePrice,
  clampPage,
  clampPageSize,
  sanitizeUsername,
} from "../validators";

describe("validators", () => {
  it("isNonEmptyString", () => {
    expect(isNonEmptyString("a")).toBe(true);
    expect(isNonEmptyString("  ")).toBe(false);
    expect(isNonEmptyString(null)).toBe(false);
    expect(isNonEmptyString("ab", 3)).toBe(false);
  });

  it("parsePrice", () => {
    expect(parsePrice(10)).toBe(10);
    expect(parsePrice("19.99")).toBe(19.99);
    expect(parsePrice(-1)).toBeNull();
    expect(parsePrice("abc")).toBeNull();
  });

  it("isPositiveNumber", () => {
    expect(isPositiveNumber(0)).toBe(true);
    expect(isPositiveNumber(-1)).toBe(false);
    expect(isPositiveNumber(NaN)).toBe(false);
  });

  it("clampPage / clampPageSize", () => {
    expect(clampPage(0)).toBe(1);
    expect(clampPage("3")).toBe(3);
    expect(clampPageSize(200)).toBe(100);
    expect(clampPageSize(0)).toBe(1);
  });

  it("sanitizeUsername", () => {
    expect(sanitizeUsername("  admin  ")).toBe("admin");
    expect(sanitizeUsername("x".repeat(100)).length).toBe(64);
  });
});
