import { describe, it, expect } from "vitest";
import {
  PUBLIC_KEYS,
  SENSITIVE_KEYS,
  DEFAULTS,
  isSensitiveKey,
} from "../config-keys";

describe("config key sets", () => {
  it("PUBLIC_KEYS has no overlap with sensitive patterns", () => {
    for (const key of PUBLIC_KEYS) {
      expect(isSensitiveKey(key)).toBe(false);
    }
  });

  it("SENSITIVE_KEYS are detected by isSensitiveKey", () => {
    for (const key of SENSITIVE_KEYS) {
      expect(isSensitiveKey(key)).toBe(true);
    }
  });

  it("defaults cover public keys", () => {
    for (const key of PUBLIC_KEYS) {
      expect(DEFAULTS).toHaveProperty(key);
    }
  });

  it("detects secret-like key names", () => {
    expect(isSensitiveKey("my_private_token")).toBe(true);
    expect(isSensitiveKey("api_key_extra")).toBe(true);
    expect(isSensitiveKey("site_name")).toBe(false);
  });
});
