import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { randomBytes } from "crypto";
import { publishChat } from "@/lib/chat-bus";

async function requireAdmin() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") return null;
  return user;
}

function serializeMsg(m: {
  id: string;
  sessionId: string;
  role: string;
  content: string;
  contact: string;
  read: boolean;
  createdAt: Date;
}) {
  return {
    id: m.id,
    sessionId: m.sessionId,
    role: m.role,
    content: m.content,
    contact: m.contact,
    read: m.read,
    createdAt: m.createdAt.toISOString(),
  };
}

/** GET ?sessionId= | ?all=1 | ?after=ISO */
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId")?.trim();
  const all = req.nextUrl.searchParams.get("all") === "1";
  const after = req.nextUrl.searchParams.get("after")?.trim();

  if (all) {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "无权限" }, { status: 403 });

    const where = after
      ? { createdAt: { gt: new Date(after) } }
      : {};
    const messages = await prisma.chatMessage.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    const unread = await prisma.chatMessage.count({
      where: { role: "user", read: false },
    });
    return NextResponse.json({
      messages: messages.map(serializeMsg),
      unread,
    });
  }

  if (!sessionId) {
    return NextResponse.json({ error: "缺少 sessionId" }, { status: 400 });
  }

  const where: {
    sessionId: string;
    createdAt?: { gt: Date };
  } = { sessionId };
  if (after) {
    where.createdAt = { gt: new Date(after) };
  }

  const messages = await prisma.chatMessage.findMany({
    where,
    orderBy: { createdAt: "asc" },
    take: 200,
  });
  return NextResponse.json({ messages: messages.map(serializeMsg) });
}

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

    const serialized = serializeMsg(msg);
    publishChat({
      type: "message",
      sessionId,
      message: serialized,
    });

    return NextResponse.json({ ok: true, message: serialized, sessionId });
  } catch (e) {
    console.error("chat POST", e);
    return NextResponse.json({ error: "发送失败" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "无权限" }, { status: 403 });
  const body = await req.json();

  if (body.markAll) {
    await prisma.chatMessage.updateMany({
      where: { role: "user", read: false },
      data: { read: true },
    });
    publishChat({ type: "read" });
    return NextResponse.json({ ok: true });
  }

  if (body.sessionId) {
    const sid = String(body.sessionId);
    await prisma.chatMessage.updateMany({
      where: { sessionId: sid, role: "user", read: false },
      data: { read: true },
    });
    publishChat({ type: "read", sessionId: sid });
    return NextResponse.json({ ok: true });
  }

  const id = String(body.id || "");
  if (!id) return NextResponse.json({ error: "缺少 id" }, { status: 400 });
  const updated = await prisma.chatMessage.update({
    where: { id },
    data: { read: true },
  });
  publishChat({ type: "read", sessionId: updated.sessionId });
  return NextResponse.json({ ok: true });
}
