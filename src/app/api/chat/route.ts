import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { randomBytes } from "crypto";

async function requireAdmin() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") return null;
  return user;
}

/** GET ?sessionId= for user thread; admin ?all=1 lists recent */
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId")?.trim();
  const all = req.nextUrl.searchParams.get("all") === "1";

  if (all) {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "无权限" }, { status: 403 });

    const messages = await prisma.chatMessage.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    const unread = await prisma.chatMessage.count({
      where: { role: "user", read: false },
    });
    return NextResponse.json({ messages, unread });
  }

  if (!sessionId) {
    return NextResponse.json({ error: "缺少 sessionId" }, { status: 400 });
  }

  const messages = await prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
    take: 100,
  });
  return NextResponse.json({ messages });
}

/** POST { content, contact?, sessionId? } — public leave message */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const content = String(body.content || "").trim().slice(0, 1000);
    if (!content) {
      return NextResponse.json({ error: "请输入内容" }, { status: 400 });
    }

    let sessionId = String(body.sessionId || "").trim();
    if (!sessionId) {
      sessionId = randomBytes(12).toString("hex");
    }

    const role = body.asAdmin ? "admin" : "user";
    if (role === "admin") {
      const admin = await requireAdmin();
      if (!admin) return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const msg = await prisma.chatMessage.create({
      data: {
        sessionId,
        role,
        content,
        contact: String(body.contact || "").trim().slice(0, 120),
        read: role === "admin",
      },
    });

    return NextResponse.json({ ok: true, message: msg, sessionId });
  } catch (e) {
    console.error("chat POST", e);
    return NextResponse.json({ error: "发送失败" }, { status: 500 });
  }
}

/** PATCH mark read { id } admin */
export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "无权限" }, { status: 403 });
  const body = await req.json();
  if (body.markAll) {
    await prisma.chatMessage.updateMany({
      where: { role: "user", read: false },
      data: { read: true },
    });
    return NextResponse.json({ ok: true });
  }
  const id = String(body.id || "");
  if (!id) return NextResponse.json({ error: "缺少 id" }, { status: 400 });
  await prisma.chatMessage.update({ where: { id }, data: { read: true } });
  return NextResponse.json({ ok: true });
}
