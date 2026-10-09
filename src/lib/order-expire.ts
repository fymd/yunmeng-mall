import { prisma } from "@/lib/prisma";
import { getConfig } from "@/lib/config";
import {
  isPendingOrderExpired,
  parseOrderTimeoutMinutes,
  timeoutCancelRemark,
} from "@/lib/order";

/**
 * Cancel PENDING orders past order_timeout_minutes.
 * Safe to call on each order list/query (lightweight batch).
 * Returns number of orders cancelled.
 */
export async function expirePendingOrders(now: Date = new Date()): Promise<number> {
  const raw = await getConfig("order_timeout_minutes");
  const minutes = parseOrderTimeoutMinutes(raw);
  if (minutes <= 0) return 0;

  const cutoff = new Date(now.getTime() - minutes * 60 * 1000);

  const expired = await prisma.order.findMany({
    where: {
      status: "PENDING",
      createdAt: { lt: cutoff },
    },
    select: { id: true, remark: true, createdAt: true },
    take: 100,
  });

  if (expired.length === 0) return 0;

  let count = 0;
  for (const o of expired) {
    if (!isPendingOrderExpired(o.createdAt, minutes, now)) continue;
    await prisma.order.update({
      where: { id: o.id },
      data: {
        status: "CANCELLED",
        remark: timeoutCancelRemark(o.remark, minutes),
      },
    });
    count += 1;
  }
  return count;
}

/** If a single PENDING order is expired, cancel it and return updated fields. */
export async function expireOneIfNeeded<T extends {
  id: string;
  status: string;
  remark: string;
  createdAt: Date;
}>(order: T, now: Date = new Date()): Promise<T> {
  if (order.status !== "PENDING") return order;
  const raw = await getConfig("order_timeout_minutes");
  const minutes = parseOrderTimeoutMinutes(raw);
  if (!isPendingOrderExpired(order.createdAt, minutes, now)) return order;

  const remark = timeoutCancelRemark(order.remark, minutes);
  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { status: "CANCELLED", remark },
  });
  return {
    ...order,
    status: updated.status,
    remark: updated.remark,
  };
}
