import { prisma } from "./prisma";
import {
  PUBLIC_KEYS,
  SENSITIVE_KEYS,
  DEFAULTS,
  isSensitiveKey,
} from "./config-keys";

export { PUBLIC_KEYS, SENSITIVE_KEYS, DEFAULTS, isSensitiveKey };

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
