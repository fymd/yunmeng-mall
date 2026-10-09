import { prisma } from "@/lib/prisma";
import { tryAutoDeliver } from "@/lib/deliver";

/**
 * Mark order PAID if currently PENDING. Then try auto card delivery.
 * Idempotent for already-paid / delivered orders.
 */
export async function markOrderPaidByOrderNo(
  orderNo: string,
  opts?: { paymentId?: string; appendRemark?: string }
): Promise<{ ok: boolean; status: string; reason?: string; delivered?: boolean }> {
  if (!orderNo) {
    return { ok: false, status: "", reason: "missing orderNo" };
  }

  const order = await prisma.order.findUnique({ where: { orderNo } });
  if (!order) {
    return { ok: false, status: "", reason: "order not found" };
  }

  if (order.status === "DELIVERED" || order.status === "COMPLETED") {
    return { ok: true, status: order.status, reason: "already delivered-ish", delivered: true };
  }

  if (order.status === "PAID") {
    const d = await tryAutoDeliver(order.id);
    return {
      ok: true,
      status: d.ok && d.delivered ? "DELIVERED" : "PAID",
      delivered: d.ok && "delivered" in d ? d.delivered : false,
      reason: "already paid",
    };
  }

  if (order.status !== "PENDING") {
    return { ok: false, status: order.status, reason: "not pending" };
  }

  let remark = order.remark || "";
  if (opts?.appendRemark) {
    remark = remark ? `${remark}\n${opts.appendRemark}` : opts.appendRemark;
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

  const d = await tryAutoDeliver(order.id);
  const finalStatus =
    d.ok && "delivered" in d && d.delivered ? "DELIVERED" : "PAID";

  return {
    ok: true,
    status: finalStatus,
    delivered: d.ok && "delivered" in d ? d.delivered : false,
  };
}
