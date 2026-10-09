import { prisma } from "@/lib/prisma";
import { notifyOrderEvent } from "@/lib/mail";

export type DeliverResult =
  | { ok: true; delivered: true; code: string; status: "DELIVERED" }
  | { ok: true; delivered: false; reason: string; status: string }
  | { ok: false; reason: string };

export async function tryAutoDeliver(orderId: string): Promise<DeliverResult> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { product: true, user: true, card: true },
  });
  if (!order) return { ok: false, reason: "order not found" };

  if (order.deliveryContent || order.status === "DELIVERED" || order.status === "COMPLETED") {
    return {
      ok: true,
      delivered: Boolean(order.deliveryContent),
      reason: "already delivered",
      status: order.status,
      ...(order.deliveryContent
        ? { code: order.deliveryContent, delivered: true as const, status: order.status as "DELIVERED" }
        : {}),
    } as DeliverResult;
  }

  if (order.status !== "PAID" && order.status !== "PENDING") {
    return { ok: true, delivered: false, reason: "status not eligible", status: order.status };
  }

  if (!order.product.autoDeliver) {
    return { ok: true, delivered: false, reason: "autoDeliver off", status: order.status };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const card = await tx.cardCode.findFirst({
        where: { productId: order.productId, status: "UNUSED" },
        orderBy: { createdAt: "asc" },
      });
      if (!card) return null;

      await tx.cardCode.update({
        where: { id: card.id },
        data: { status: "SOLD", orderId: order.id, soldAt: new Date() },
      });

      const note = "[系统] 自动发货成功";
      const remark = order.remark?.includes(note)
        ? order.remark
        : [order.remark, note].filter(Boolean).join("\n").slice(0, 500);

      await tx.order.update({
        where: { id: order.id },
        data: {
          status: "DELIVERED",
          deliveryContent: card.code,
          paidAt: order.paidAt || new Date(),
          remark,
        },
      });

      const left = await tx.cardCode.count({
        where: { productId: order.productId, status: "UNUSED" },
      });
      let stockStatus = order.product.stockStatus;
      if (left === 0) stockStatus = "SOLD_OUT";
      else if (left <= 3) stockStatus = "LOW";
      else if (left <= 10) stockStatus = "SUFFICIENT";
      else stockStatus = "PLENTY";
      if (stockStatus !== order.product.stockStatus) {
        await tx.product.update({
          where: { id: order.productId },
          data: { stockStatus },
        });
      }

      return { code: card.code };
    });

    if (!result) {
      const note = "[系统] 自动发货失败：卡密库存不足，请联系客服";
      const remark = order.remark?.includes("卡密库存不足")
        ? order.remark
        : [order.remark, note].filter(Boolean).join("\n").slice(0, 500);
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: order.status === "PENDING" ? "PAID" : order.status,
          paidAt: order.paidAt || new Date(),
          remark,
        },
      });
      return { ok: true, delivered: false, reason: "no unused cards", status: "PAID" };
    }

    void notifyOrderEvent({
      orderNo: order.orderNo,
      status: "DELIVERED",
      productName: order.product.name,
      deliveryContent: result.code,
      userEmail: order.user?.email,
    });

    return { ok: true, delivered: true, code: result.code, status: "DELIVERED" };
  } catch (e) {
    console.error("tryAutoDeliver", e);
    return { ok: false, reason: String(e) };
  }
}
