import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

async function requireAdmin() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") return null;
  return user;
}

export async function GET(req: NextRequest) {
  try {
    const all = req.nextUrl.searchParams.get("all") === "1";
    const where = all ? {} : { enabled: true };
    if (all) {
      const admin = await requireAdmin();
      if (!admin) return NextResponse.json({ error: "\u65e0\u6743\u9650" }, { status: 403 });
    }
    const categories = await prisma.category.findMany({
      where,
      orderBy: { sort: "asc" },
      select: {
        id: true,
        name: true,
        sort: true,
        enabled: true,
        createdAt: true,
        _count: { select: { products: true } },
      },
    });
    return NextResponse.json({
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        sort: c.sort,
        enabled: c.enabled,
        productCount: c._count.products,
        createdAt: c.createdAt,
      })),
    });
  } catch (e) {
    console.error("categories GET error", e);
    return NextResponse.json({ categories: [], error: "Database not ready" });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "\u65e0\u6743\u9650" }, { status: 403 });
    const body = await req.json();
    const name = String(body.name || "").trim();
    if (!name) return NextResponse.json({ error: "\u5206\u7c7b\u540d\u79f0\u5fc5\u586b" }, { status: 400 });
    const sort = Number(body.sort ?? 0);
    const enabled = body.enabled !== false;
    const existing = await prisma.category.findFirst({ where: { name } });
    if (existing) return NextResponse.json({ error: "\u5206\u7c7b\u540d\u79f0\u5df2\u5b58\u5728" }, { status: 400 });
    const category = await prisma.category.create({ data: { name, sort, enabled } });
    return NextResponse.json({ ok: true, category });
  } catch (e) {
    console.error("categories POST error", e);
    return NextResponse.json({ error: "\u521b\u5efa\u5931\u8d25" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "\u65e0\u6743\u9650" }, { status: 403 });
    const body = await req.json();
    const id = String(body.id || "");
    if (!id) return NextResponse.json({ error: "\u7f3a\u5c11 id" }, { status: 400 });
    const data: { name?: string; sort?: number; enabled?: boolean } = {};
    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (!name) return NextResponse.json({ error: "\u540d\u79f0\u4e0d\u80fd\u4e3a\u7a7a" }, { status: 400 });
      data.name = name;
    }
    if (body.sort !== undefined) data.sort = Number(body.sort);
    if (body.enabled !== undefined) data.enabled = Boolean(body.enabled);
    const category = await prisma.category.update({ where: { id }, data });
    return NextResponse.json({ ok: true, category });
  } catch (e) {
    console.error("categories PATCH error", e);
    return NextResponse.json({ error: "\u66f4\u65b0\u5931\u8d25" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "\u65e0\u6743\u9650" }, { status: 403 });
    const body = await req.json();
    const id = String(body.id || "");
    if (!id) return NextResponse.json({ error: "\u7f3a\u5c11 id" }, { status: 400 });
    const count = await prisma.product.count({ where: { categoryId: id } });
    if (count > 0) {
      return NextResponse.json(
        { error: "\u8be5\u5206\u7c7b\u4e0b\u8fd8\u6709 " + count + " \u4e2a\u5546\u54c1\uff0c\u65e0\u6cd5\u5220\u9664" },
        { status: 400 }
      );
    }
    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("categories DELETE error", e);
    return NextResponse.json({ error: "\u5220\u9664\u5931\u8d25" }, { status: 500 });
  }
}
