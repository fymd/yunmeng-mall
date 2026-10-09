import { getConfig } from "@/lib/config";
import { createTransport } from "./mail-transport";

/**
 * Send transactional email if SMTP is configured.
 * No-op when smtp_host empty (safe for local/dev).
 */
export async function sendMail(opts: {
  to: string;
  subject: string;
  text: string;
}): Promise<{ ok: boolean; reason?: string }> {
  const to = (opts.to || "").trim();
  if (!to || !to.includes("@")) {
    return { ok: false, reason: "invalid to" };
  }

  const host = (await getConfig("smtp_host")).trim();
  if (!host) {
    return { ok: false, reason: "smtp not configured" };
  }

  const port = Number((await getConfig("smtp_port")) || "587") || 587;
  const user = (await getConfig("smtp_user")).trim();
  const pass = (await getConfig("smtp_pass")).trim();
  const from =
    (await getConfig("smtp_from")).trim() || user || "noreply@localhost";

  try {
    const transport = createTransport({
      host,
      port,
      user: user || undefined,
      pass: pass || undefined,
    });
    await transport.send({
      from,
      to,
      subject: opts.subject,
      text: opts.text,
    });
    return { ok: true };
  } catch (e) {
    console.error("[mail]", e);
    return { ok: false, reason: String(e) };
  }
}

export async function notifyOrderEvent(opts: {
  orderNo: string;
  status: string;
  productName?: string;
  deliveryContent?: string;
  userEmail?: string | null;
}) {
  const adminTo = (await getConfig("notify_email")).trim();
  const lines = [
    `订单 ${opts.orderNo}`,
    `状态: ${opts.status}`,
    opts.productName ? `商品: ${opts.productName}` : "",
    opts.deliveryContent ? `发货: ${opts.deliveryContent}` : "",
  ].filter(Boolean);

  if (adminTo) {
    await sendMail({
      to: adminTo,
      subject: `[云梦] 订单 ${opts.orderNo} → ${opts.status}`,
      text: lines.join("\n"),
    });
  }

  if (opts.userEmail) {
    await sendMail({
      to: opts.userEmail,
      subject: `订单 ${opts.orderNo} 状态更新：${opts.status}`,
      text: lines.join("\n") + "\n\n请登录商城查看详情。",
    });
  }
}
