import { NextRequest, NextResponse } from "next/server";
import {
  getConfig,
  getPublicConfig,
  getAdminConfig,
  setConfig,
  setConfigs,
  isSensitiveKey,
  DEFAULTS,
  PUBLIC_KEYS,
  SENSITIVE_KEYS,
} from "@/lib/config";
import { getSessionUser } from "@/lib/auth";
import {
  forbidden,
  badRequest,
  serverError,
  parseJsonBody,
} from "@/lib/api-error";

async function requireAdmin() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") return null;
  return user;
}

const ALLOWED_KEYS = new Set([
  ...PUBLIC_KEYS,
  ...SENSITIVE_KEYS,
  ...Object.keys(DEFAULTS),
]);

/**
 * GET /api/config
 * - default: public configs only
 * - ?key=xxx: single key (public only unless admin)
 * - ?all=1: full config including sensitive keys (admin only)
 */
export async function GET(req: NextRequest) {
  try {
    const key = req.nextUrl.searchParams.get("key");
    const all = req.nextUrl.searchParams.get("all") === "1";

    if (all) {
      const admin = await requireAdmin();
      if (!admin) return forbidden();
      const config = await getAdminConfig();
      return NextResponse.json({ config });
    }

    if (key) {
      if (isSensitiveKey(key)) {
        const admin = await requireAdmin();
        if (!admin) return forbidden();
      }
      const value = await getConfig(key);
      return NextResponse.json({ key, value });
    }

    const publicConfig = await getPublicConfig();
    return NextResponse.json(publicConfig);
  } catch (e) {
    return serverError("Failed to load config", e);
  }
}

/**
 * POST /api/config
 * Admin only.
 * Body: { key, value } or { configs: { key: value, ... } }
 */
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return forbidden();

    const { data: body, error: parseError } = await parseJsonBody(req);
    if (parseError || !body) return badRequest(parseError || "无效请求体");

    if (body.configs && typeof body.configs === "object") {
      const configs = body.configs as Record<string, unknown>;
      const toSave: Record<string, string> = {};
      for (const [k, v] of Object.entries(configs)) {
        if (!ALLOWED_KEYS.has(k) && !(k in DEFAULTS)) continue;
        if (typeof v === "string" && v === "********" && isSensitiveKey(k)) {
          continue;
        }
        toSave[k] = String(v ?? "");
      }
      await setConfigs(toSave);
      return NextResponse.json({ ok: true, updated: Object.keys(toSave) });
    }

    const key = body.key as string | undefined;
    const value = body.value as string | undefined;
    if (!key || value === undefined) {
      return badRequest("key and value required, or configs object");
    }
    if (!ALLOWED_KEYS.has(key) && !(key in DEFAULTS)) {
      return badRequest("不允许的配置项: " + key);
    }
    if (value === "********" && isSensitiveKey(key)) {
      return NextResponse.json({ ok: true, key, skipped: true });
    }
    await setConfig(key, String(value));
    return NextResponse.json({ ok: true, key, value });
  } catch (e) {
    return serverError("Failed to save config", e);
  }
}
