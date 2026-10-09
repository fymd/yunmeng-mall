import { prisma } from "./prisma";

const DEFAULTS: Record<string, string> = {
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
};

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

export async function getAllConfig(): Promise<Record<string, string>> {
  const rows = await prisma.config.findMany();
  const result = { ...DEFAULTS };
  for (const row of rows) {
    result[row.key] = row.value;
  }
  return result;
}
