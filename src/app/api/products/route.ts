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
    const { searchParams } = req.nextUrl;
    const categoryId = searchParams.get("categoryId");
    const q = searchParams.get("q")?.trim();
    const all = searchParams.get("all") === "1";
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") || 20)));

    if (all) {
      const admin = await requireAdmin();
      if (!admin) return NextResponse.json({ error: "\u65e0\u6743\u9650" }, { status: 403 });
    }

    const where: {
      enabled?: boolean;
      categoryId?: string;
      name?: { contains: string };
    } = {};

    if (!all) where.enabled = true;
    if (categoryId && categoryId !== "all") where.categoryId = categoryId;
    if (q) where.name = { contains: q };

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          stockStatus: true,
          tags: true,
          imageUrl: true,
          enabled: true,
          categoryId: true,
          category: { select: { id: true, name: true } },
          createdAt: true,
        },
      }),
    ]);

    return NextResponse.json({
      products,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (e) {
    console.error("products GET error", e);
    return NextResponse.json({
      products: [],
      total: 0,
      page: 1,
      pageSize: 20,
      totalPages: 0,
      error: "Database not ready",
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "\u65e0\u6743\u9650" }, { status: 403 });

    const body = await req.json();
    const name = String(body.name || "").trim();
    const categoryId = String(body.categoryId || "");
    const price = Number(body.price);
    if (!name) return NextResponse.json({ error: "\u5546\u54c1\u540d\u79f0\u5fc5\u586b" }, { status: 400 });
    if (!categoryId) return NextResponse.json({ error: "\u8bf7\u9009\u62e9\u5206\u7c7b" }, { status: 400 });
    if (Number.isNaN(price) || price < 0) {
      return NextResponse.json({ error: "\u4ef7\u683c\u65e0\u6548" }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        name,
        categoryId,
        price,
        description: String(body.description || ""),
        stockStatus: body.stockStatus || "PLENTY",
        tags: String(body.tags || ""),
        imageUrl: body.imageUrl || null,
        enabled: body.enabled !== false,
      },
    });

    return NextResponse.json({ ok: true, product });
  } catch (e) {
    console.error("products POST error", e);
    return NextResponse.json({ error: "\u521b\u5efa\u5931\u8d25", message: String(e) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "\u65e0\u6743\u9650" }, { status: 403 });

    const body = await req.json();
    const id = String(body.id || "");
    if (!id) return NextResponse.json({ error: "\u7f3a\u5c11 id" }, { status: 400 });

    const data: Record<string, unknown> = {};
    if (body.name !== undefined) data.name = String(body.name).trim();
    if (body.categoryId !== undefined) data.categoryId = String(body.categoryId);
    if (body.price !== undefined) data.price = Number(body.price);
    if (body.description !== undefined) data.description = String(body.description);
    if (body.stockStatus !== undefined) data.stockStatus = body.stockStatus;
    if (body.tags !== undefined) data.tags = String(body.tags);
    if (body.imageUrl !== undefined) data.imageUrl = body.imageUrl || null;
    if (body.enabled !== undefined) data.enabled = Boolean(body.enabled);

    const product = await prisma.product.update({ where: { id }, data });
    return NextResponse.json({ ok: true, product });
  } catch (e) {
    console.error("products PATCH error", e);
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

    const orderCount = await prisma.order.count({ where: { productId: id } });
    if (orderCount > 0) {
      await prisma.product.update({ where: { id }, data: { enabled: false } });
      return NextResponse.json({
        ok: true,
        softDeleted: true,
        message: "\u8be5\u5546\u54c1\u5df2\u6709\u8ba2\u5355\uff0c\u5df2\u6539\u4e3a\u4e0b\u67b6\u800c\u975e\u5220\u9664",
      });
    }

    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("products DELETE error", e);
    return NextResponse.json({ error: "\u5220\u9664\u5931\u8d25" }, { status: 500 });
  }
}
