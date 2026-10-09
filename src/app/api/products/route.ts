import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/products
 * Query: categoryId, q (search), page, pageSize
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const categoryId = searchParams.get("categoryId");
    const q = searchParams.get("q")?.trim();
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize") || 20)));

    const where: {
      enabled: boolean;
      categoryId?: string;
      name?: { contains: string };
    } = { enabled: true };

    if (categoryId && categoryId !== "all") {
      where.categoryId = categoryId;
    }
    if (q) {
      where.name = { contains: q };
    }

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
          categoryId: true,
          category: { select: { id: true, name: true } },
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
      error: "Database not ready. Run: npx prisma db push && npm run db:seed",
    });
  }
}
