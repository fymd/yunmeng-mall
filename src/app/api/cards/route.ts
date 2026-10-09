import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

async function requireAdmin() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") return null;
  return user;
}

/** GET /api/cards?productId=&status=UNUSED|SOLD|all */
export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "无权限" }, { status: 403 });

  const productId = req.nextUrl.searchParams.get("productId") || "";
  const status = req.nextUrl.searchParams.get("status") || "all";
  const page = Math.max(1, Number(req.nextUrl.searchParams.get("page") || 1));
  const pageSize = Math.min(100, Math.max(1, Number(req.nextUrl.searchParams.get("pageSize") || 50)));

  const where: {
    productId?: string;
    status?: "UNUSED" | "SOLD" | "VOID";
  } = {};
  if (productId) where.productId = productId;
  if (status === "UNUSED" || status === "SOLD" || status === "VOID") {
    where.status = status;
  }

  const [total, cards, unused, sold] = await Promise.all([
    prisma.cardCode.count({ where }),
    prisma.cardCode.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        product: { select: { id: true, name: true } },
        order: { select: { orderNo: true } },
      },
    }),
    productId
      ? prisma.cardCode.count({ where: { productId, status: "UNUSED" } })
      : prisma.cardCode.count({ where: { status: "UNUSED" } }),
    productId
      ? prisma.cardCode.count({ where: { productId, status: "SOLD" } })
      : prisma.cardCode.count({ where: { status: "SOLD" } }),
  ]);

  return NextResponse.json({
    cards: cards.map((c) => ({
      id: c.id,
      code: c.status === "UNUSED" ? c.code : maskCode(c.code),
      codeFull: c.code,
      status: c.status,
      productId: c.productId,
      productName: c.product.name,
      orderNo: c.order?.orderNo ?? null,
      soldAt: c.soldAt,
      createdAt: c.createdAt,
    })),
    total,
    unused,
    sold,
    page,
    pageSize,
  });
}

function maskCode(code: string): string {
  if (code.length <= 4) return "****";
  return code.slice(0, 2) + "****" + code.slice(-2);
}

/**
 * POST /api/cards
 * Body: { productId, codes: string } — codes newline or comma separated
 */
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "无权限" }, { status: 403 });

  const body = await req.json();
  const productId = String(body.productId || "");
  if (!productId) {
    return NextResponse.json({ error: "缺少 productId" }, { status: 400 });
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    return NextResponse.json({ error: "商品不存在" }, { status: 404 });
  }

  const raw = String(body.codes || "");
  const lines = raw
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return NextResponse.json({ error: "请粘贴至少一条卡密" }, { status: 400 });
  }

  // Dedupe within batch
  const unique = [...new Set(lines)];
  let created = 0;
  for (const code of unique) {
    try {
      await prisma.cardCode.create({
        data: { productId, code, status: "UNUSED" },
      });
      created += 1;
    } catch {
      // skip duplicate or error
    }
  }

  // Enable autoDeliver if requested or default when importing
  if (body.enableAutoDeliver !== false) {
    await prisma.product.update({
      where: { id: productId },
      data: { autoDeliver: true },
    });
  }

  const unused = await prisma.cardCode.count({
    where: { productId, status: "UNUSED" },
  });
  let stockStatus: "PLENTY" | "SUFFICIENT" | "LOW" | "SOLD_OUT" = "PLENTY";
  if (unused === 0) stockStatus = "SOLD_OUT";
  else if (unused <= 3) stockStatus = "LOW";
  else if (unused <= 10) stockStatus = "SUFFICIENT";
  await prisma.product.update({
    where: { id: productId },
    data: { stockStatus },
  });

  return NextResponse.json({
    ok: true,
    created,
    skipped: unique.length - created,
    unused,
  });
}

/** DELETE body: { id } void or delete unused only */
export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "无权限" }, { status: 403 });

  const body = await req.json();
  const id = String(body.id || "");
  if (!id) return NextResponse.json({ error: "缺少 id" }, { status: 400 });

  const card = await prisma.cardCode.findUnique({ where: { id } });
  if (!card) return NextResponse.json({ error: "不存在" }, { status: 404 });

  if (card.status === "SOLD") {
    await prisma.cardCode.update({
      where: { id },
      data: { status: "VOID" },
    });
    return NextResponse.json({ ok: true, voided: true });
  }

  await prisma.cardCode.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
