import { prisma } from "@/lib/prisma";

/**
 * Mark order PAID if currently PENDING. Idempotent for already-paid orders.
 */
export async function markOrderPaidByOrderNo(
  orderNo: string,
  opts?: { paymentId?: string; appendRemark?: string }
): Promise<{ ok: boolean; status: string; reason?: string }> {
  if (!orderNo) {
    return { ok: false, status: "", reason: "missing orderNo" };
  }

  const order = await prisma.order.findUnique({ where: { orderNo } });
  if (!order) {
    return { ok: false, status: "", reason: "order not found" };
  }

  if (order.status === "PAID" || order.status === "DELIVERED" || order.status === "COMPLETED") {
    return { ok: true, status: order.status, reason: "already paid-ish" };
  }

  if (order.status !== "PENDING") {
    return { ok: false, status: order.status, reason: "not pending" };
  }

  let remark = order.remark || "";
  if (opts?.appendRemark) {
    remark = remark
      ? `${remark}\n${opts.appendRemark}`
      : opts.appendRemark;
  }
  if (opts?.paymentId) {
    const tag = `[支付单号] ${opts.paymentId}`;
    if (!remark.includes(tag)) {
      remark = remark ? `${remark}\n${tag}` : tag;
    }
  }

  await prisma.order.update({
    where: { id: order.id },
    data: {
      status: "PAID",
      paidAt: new Date(),
      remark: remark.slice(0, 500),
    },
  });

  return { ok: true, status: "PAID" };
}
