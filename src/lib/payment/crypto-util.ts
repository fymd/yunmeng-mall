import { createHash, createSign, createVerify, randomBytes } from "crypto";

/** Normalize PEM: accept raw base64 or full PEM block. */
export function normalizePem(
  key: string,
  type: "PRIVATE KEY" | "PUBLIC KEY" | "RSA PRIVATE KEY" | "RSA PUBLIC KEY"
): string {
  const trimmed = key.trim().replace(/\r/g, "");
  if (trimmed.includes("-----BEGIN")) {
    return trimmed;
  }
  const body = trimmed.replace(/\s+/g, "");
  const lines = body.match(/.{1,64}/g) || [body];
  return `-----BEGIN ${type}-----\n${lines.join("\n")}\n-----END ${type}-----`;
}

/** Alipay RSA2 (SHA256withRSA) sign */
export function alipaySignRsa2(
  params: Record<string, string>,
  privateKeyPem: string
): string {
  const content = buildKeyValueContent(params, ["sign"]);
  const key = normalizePem(privateKeyPem, "RSA PRIVATE KEY");
  // Try PKCS#8 if PKCS#1 fails
  let sign: string;
  try {
    const signer = createSign("RSA-SHA256");
    signer.update(content, "utf8");
    sign = signer.sign(key, "base64");
  } catch {
    const key8 = normalizePem(privateKeyPem, "PRIVATE KEY");
    const signer = createSign("RSA-SHA256");
    signer.update(content, "utf8");
    sign = signer.sign(key8, "base64");
  }
  return sign;
}

export function alipayVerifyRsa2(
  params: Record<string, string>,
  publicKeyPem: string
): boolean {
  const sign = params.sign;
  if (!sign) return false;
  const content = buildKeyValueContent(params, ["sign", "sign_type"]);
  const tryKeys = [
    normalizePem(publicKeyPem, "PUBLIC KEY"),
    normalizePem(publicKeyPem, "RSA PUBLIC KEY"),
  ];
  for (const key of tryKeys) {
    try {
      const verifier = createVerify("RSA-SHA256");
      verifier.update(content, "utf8");
      if (verifier.verify(key, sign, "base64")) return true;
    } catch {
      // try next
    }
  }
  return false;
}

/** Sorted key=value& joined, skip empty and listed keys */
export function buildKeyValueContent(
  params: Record<string, string>,
  skip: string[] = []
): string {
  const skipSet = new Set(skip.map((s) => s.toLowerCase()));
  return Object.keys(params)
    .filter((k) => {
      if (skipSet.has(k.toLowerCase())) return false;
      const v = params[k];
      return v !== undefined && v !== null && String(v) !== "";
    })
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
}

/** WeChat Pay V2 sign: MD5(content + &key=APIKEY).toUpperCase() */
export function wechatSignMd5(
  params: Record<string, string>,
  apiKey: string
): string {
  const content = buildKeyValueContent(params, ["sign"]);
  const str = `${content}&key=${apiKey}`;
  return createHash("md5").update(str, "utf8").digest("hex").toUpperCase();
}

export function wechatVerifyMd5(
  params: Record<string, string>,
  apiKey: string
): boolean {
  const sign = params.sign;
  if (!sign) return false;
  return wechatSignMd5(params, apiKey) === sign.toUpperCase();
}

export function randomNonceStr(len = 32): string {
  return randomBytes(Math.ceil(len / 2))
    .toString("hex")
    .slice(0, len);
}

/** Minimal XML builder for WeChat API */
export function toXml(obj: Record<string, string>): string {
  const body = Object.entries(obj)
    .map(([k, v]) => `<${k}><![CDATA[${v}]]></${k}>`)
    .join("");
  return `<xml>${body}</xml>`;
}

/** Minimal XML → flat string map */
export function fromXml(xml: string): Record<string, string> {
  const out: Record<string, string> = {};
  const re =
    /<([a-zA-Z0-9_]+)>(?:<!\[CDATA\[(.*?)\]\]>|([^<]*))<\/\1>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) {
    out[m[1]] = m[2] !== undefined ? m[2] : (m[3] || "").trim();
  }
  return out;
}
