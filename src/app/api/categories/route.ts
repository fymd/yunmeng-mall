import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/categories
 * Returns enabled categories ordered by sort.
 */
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: { enabled: true },
      orderBy: { sort: "asc" },
      select: {
        id: true,
        name: true,
        sort: true,
        _count: { select: { products: true } },
      },
    });

    return NextResponse.json({
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        sort: c.sort,
        productCount: c._count.products,
      })),
    });
  } catch (e) {
    console.error("categories GET error", e);
    return NextResponse.json({
      categories: [],
      error: "Database not ready. Run: npx prisma db push && npm run db:seed",
    });
  }
}
