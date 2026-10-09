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

/** Sensitive keys only returned to admin */
export const SENSITIVE_KEYS = [
  "alipay_app_id",
  "alipay_private_key",
  "alipay_public_key",
  "alipay_notify_url",
  "wechat_app_id",
  "wechat_mch_id",
  "wechat_api_key",
  "wechat_notify_url",
  "smtp_pass",
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
  smtp_host: "",
  smtp_port: "587",
  smtp_user: "",
  smtp_pass: "",
  smtp_from: "",
  notify_email: "",
};

export function isSensitiveKey(key: string): boolean {
  const k = key.toLowerCase();
  return (
    k.includes("private") ||
    k.includes("secret") ||
    k.includes("api_key") ||
    k.includes("cert") ||
    k.includes("smtp_pass") ||
    (SENSITIVE_KEYS as readonly string[]).includes(key)
  );
}
