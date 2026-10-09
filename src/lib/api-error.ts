import { NextResponse } from "next/server";

/**
 * Consistent JSON error responses for API routes.
 */
export function jsonError(
  error: string,
  status: number,
  extra?: Record<string, unknown>
) {
  return NextResponse.json({ error, ...extra }, { status });
}

export function unauthorized(message = "请先登录") {
  return jsonError(message, 401, { code: "UNAUTHORIZED" });
}

export function forbidden(message = "无权限") {
  return jsonError(message, 403, { code: "FORBIDDEN" });
}

export function badRequest(message: string, extra?: Record<string, unknown>) {
  return jsonError(message, 400, extra);
}

export function notFound(message = "资源不存在") {
  return jsonError(message, 404);
}

export function serverError(message = "服务器错误", cause?: unknown) {
  if (cause) {
    console.error(message, cause);
  }
  return jsonError(message, 500, {
    message: cause instanceof Error ? cause.message : String(cause ?? ""),
  });
}

/** Safe parse of JSON body; returns null on failure */
export async function parseJsonBody<T = Record<string, unknown>>(
  req: Request
): Promise<{ data: T | null; error: string | null }> {
  try {
    const data = (await req.json()) as T;
    return { data, error: null };
  } catch {
    return { data: null, error: "请求体不是有效的 JSON" };
  }
}
