import { NextRequest, NextResponse } from "next/server";
import { changePassword, getSessionUser } from "@/lib/auth";

/**
 * POST /api/auth/password
 * Body: { currentPassword, newPassword, confirmPassword? }
 * Requires login. Changes password for the current session user.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json(
        { error: "请先登录", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const currentPassword = String(body.currentPassword ?? "");
    const newPassword = String(body.newPassword ?? "");
    const confirmPassword =
      body.confirmPassword !== undefined
        ? String(body.confirmPassword)
        : undefined;

    if (confirmPassword !== undefined && confirmPassword !== newPassword) {
      return NextResponse.json(
        { error: "两次输入的新密码不一致" },
        { status: 400 }
      );
    }

    await changePassword(session.id, currentPassword, newPassword);

    return NextResponse.json({
      ok: true,
      message: "密码已修改，请使用新密码登录",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "修改失败";
    const status =
      msg.includes("当前密码") || msg.includes("至少") || msg.includes("相同")
        ? 400
        : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
