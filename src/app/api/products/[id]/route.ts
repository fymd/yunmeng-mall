import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/products/[id]
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await prisma.product.findFirst({
      where: { id, enabled: true },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        stockStatus: true,
        tags: true,
        imageUrl: true,
        categoryId: true,
        category: { select: { id: true, name: true } },
        createdAt: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: "\u5546\u54c1\u4e0d\u5b58\u5728" }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (e) {
    console.error("product detail error", e);
    return NextResponse.json(
      { error: "\u52a0\u8f7d\u5931\u8d25", message: String(e) },
      { status: 500 }
    );
  }
}
