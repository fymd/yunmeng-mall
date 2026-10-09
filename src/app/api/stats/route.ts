import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

/** Admin dashboard stats */
export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const [
    products,
    categories,
    orders,
    byStatus,
    revenue,
    cardsUnused,
    unreadChat,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.category.count(),
    prisma.order.count(),
    prisma.order.groupBy({
      by: ["status"],
      _count: { status: true },
    }),
    prisma.order.aggregate({
      where: {
        status: { in: ["PAID", "DELIVERED", "COMPLETED"] },
      },
      _sum: { amount: true },
    }),
    prisma.cardCode.count({ where: { status: "UNUSED" } }),
    prisma.chatMessage.count({ where: { role: "user", read: false } }),
  ]);

  const statusMap: Record<string, number> = {};
  for (const row of byStatus) {
    statusMap[row.status] = row._count.status;
  }

  // Last 7 days order counts (approx by createdAt)
  const since = new Date();
  since.setDate(since.getDate() - 6);
  since.setHours(0, 0, 0, 0);
  const recent = await prisma.order.findMany({
    where: { createdAt: { gte: since } },
    select: { createdAt: true, amount: true, status: true },
  });

  const dayMap: Record<string, { count: number; revenue: number }> = {};
  for (let i = 0; i < 7; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    dayMap[key] = { count: 0, revenue: 0 };
  }
  for (const o of recent) {
    const key = o.createdAt.toISOString().slice(0, 10);
    if (!dayMap[key]) dayMap[key] = { count: 0, revenue: 0 };
    dayMap[key].count += 1;
    if (["PAID", "DELIVERED", "COMPLETED"].includes(o.status)) {
      dayMap[key].revenue += o.amount;
    }
  }

  return NextResponse.json({
    products,
    categories,
    orders,
    statusMap,
    revenue: revenue._sum.amount || 0,
    cardsUnused,
    unreadChat,
    last7Days: Object.entries(dayMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date, ...v })),
  });
}
