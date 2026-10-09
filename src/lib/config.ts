import { prisma } from "./prisma";

/** Public keys safe to expose to any visitor */
export const PUBLIC_KEYS = [
  "site_name",
  "site_logo",
  "customer_service_qq",
  "customer_service_wechat",
  "customer_service_link",
  "announcement_title",
  "announcement_content",
  "announcement_popup",
  "payment_mode",
  "force_login_to_order",
  "order_timeout_minutes",
] as const;

/** Sensitive keys only returned to admin (values may be masked in UI) */
export const SENSITIVE_KEYS = [
  "alipay_app_id",
  "alipay_private_key",
  "alipay_public_key",
  "alipay_notify_url",
  "wechat_app_id",
  "wechat_mch_id",
  "wechat_api_key",
  "wechat_notify_url",
] as const;

export const DEFAULTS: Record<string, string> = {
  site_name: "云梦AI代充",
  site_logo: "",
  customer_service_qq: "",
  customer_service_wechat: "",
  customer_service_link: "",
  announcement_title: "公告",
  announcement_content: "欢迎使用云梦AI代充商城。支付相关问题请联系客服。",
  announcement_popup: "true",
  payment_mode: "mock",
  force_login_to_order: "true",
  order_timeout_minutes: "30",
  alipay_app_id: "",
  alipay_private_key: "",
  alipay_public_key: "",
  alipay_notify_url: "",
  wechat_app_id: "",
  wechat_mch_id: "",
  wechat_api_key: "",
  wechat_notify_url: "",
};

function isSensitiveKey(key: string): boolean {
  const k = key.toLowerCase();
  return (
    k.includes("private") ||
    k.includes("secret") ||
    k.includes("api_key") ||
    k.includes("cert") ||
    SENSITIVE_KEYS.includes(key as (typeof SENSITIVE_KEYS)[number])
  );
}

export async function getConfig(key: string): Promise<string> {
  try {
    const row = await prisma.config.findUnique({ where: { key } });
    if (row) return row.value;
  } catch {
    // db not ready
  }
  return process.env[key.toUpperCase()] || DEFAULTS[key] || "";
}

export async function setConfig(key: string, value: string): Promise<void> {
  await prisma.config.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

export async function setConfigs(
  entries: Record<string, string>
): Promise<void> {
  for (const [key, value] of Object.entries(entries)) {
    await setConfig(key, value);
  }
}

export async function getAllConfig(): Promise<Record<string, string>> {
  const rows = await prisma.config.findMany();
  const result = { ...DEFAULTS };
  for (const row of rows) {
    result[row.key] = row.value;
  }
  return result;
}

export async function getPublicConfig(): Promise<Record<string, string>> {
  const all = await getAllConfig();
  const publicConfig: Record<string, string> = {};
  for (const key of PUBLIC_KEYS) {
    publicConfig[key] = all[key] ?? DEFAULTS[key] ?? "";
  }
  return publicConfig;
}

export async function getAdminConfig(): Promise<Record<string, string>> {
  return getAllConfig();
}

export { isSensitiveKey };
