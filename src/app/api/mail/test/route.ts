import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getConfig } from "@/lib/config";
import { sendMail } from "@/lib/mail";

/**
 * POST /api/mail/test
 * Admin only. Body: { to?, smtp_host?, smtp_port?, smtp_user?, smtp_pass?, smtp_from? }
 * Uses form overrides when provided; password ******** falls back to saved config.
 */
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const to =
      String(body.to || "").trim() ||
      (await getConfig("notify_email")).trim() ||
      String(body.smtp_user || "").trim();

    if (!to || !to.includes("@")) {
      return NextResponse.json(
        {
          error:
            "请填写有效的收件邮箱（测试收件人或管理员通知邮箱）",
        },
        { status: 400 }
      );
    }

    const result = await sendMail({
      to,
      subject: "[云梦商城] SMTP 测试邮件",
      text: [
        "这是一封来自云梦 AI 代充商城的测试邮件。",
        "",
        `时间: ${new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}`,
        `收件: ${to}`,
        "",
        "若你能看到此邮件，说明 SMTP 配置可用。",
      ].join("\n"),
      smtp: {
        host: body.smtp_host,
        port: body.smtp_port,
        user: body.smtp_user,
        pass: body.smtp_pass,
        from: body.smtp_from,
      },
    });

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.reason || "发送失败" },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true, to });
  } catch (e) {
    console.error("mail test", e);
    return NextResponse.json(
      { error: "发送异常", message: String(e) },
      { status: 500 }
    );
  }
}
