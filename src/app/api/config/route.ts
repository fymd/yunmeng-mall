import { NextRequest, NextResponse } from "next/server";
import { getConfig, getAllConfig, setConfig } from "@/lib/config";

/**
 * GET /api/config          → all public configs
 * GET /api/config?key=xxx  → single key
 * POST /api/config         → set key (admin will guard later)
 */
export async function GET(req: NextRequest) {
  try {
    const key = req.nextUrl.searchParams.get("key");
    if (key) {
      const value = await getConfig(key);
      return NextResponse.json({ key, value });
    }
    const all = await getAllConfig();
    const publicConfig: Record<string, string> = {};
    for (const [k, v] of Object.entries(all)) {
      if (
        k.includes("private") ||
        k.includes("secret") ||
        k.includes("key") ||
        k.includes("cert")
      ) {
        continue;
      }
      publicConfig[k] = v;
    }
    return NextResponse.json(publicConfig);
  } catch (e) {
    console.error("config GET error", e);
    return NextResponse.json(
      { error: "Failed to load config" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { key, value } = body as { key?: string; value?: string };
    if (!key || value === undefined) {
      return NextResponse.json(
        { error: "key and value required" },
        { status: 400 }
      );
    }
    // TODO: add admin auth guard in T13
    await setConfig(key, String(value));
    return NextResponse.json({ ok: true, key, value });
  } catch (e) {
    console.error("config POST error", e);
    return NextResponse.json(
      { error: "Failed to save config" },
      { status: 500 }
    );
  }
}
