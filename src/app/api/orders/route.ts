import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { generateOrderNo } from "@/lib/order";
import { getPaymentProvider } from "@/lib/payment";
import { getConfig } from "@/lib/config";

/**
 * POST /api/orders
 * Body: { productId }
 * Requires login. Creates order + runs mock payment.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { error: "\u8bf7\u5148\u767b\u5f55", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { productId } = body as { productId?: string };
    if (!productId) {
      return NextResponse.json({ error: "\u7f3a\u5c11 productId" }, { status: 400 });
    }

    const product = await prisma.product.findFirst({
      where: { id: productId, enabled: true },
    });
    if (!product) {
      return NextResponse.json({ error: "\u5546\u54c1\u4e0d\u5b58\u5728\u6216\u5df2\u4e0b\u67b6" }, { status: 404 });
    }
    if (product.stockStatus === "SOLD_OUT") {
      return NextResponse.json({ error: "\u5546\u54c1\u5df2\u552e\u7f44" }, { status: 400 });
    }

    const orderNo = generateOrderNo();
    const amount = product.price;

    const order = await prisma.order.create({
      data: {
        orderNo,
        userId: user.id,
        productId: product.id,
        amount,
        status: "PENDING",
      },
      include: {
        product: { select: { name: true } },
      },
    });

    const mode = await getConfig("payment_mode");
    const provider = getPaymentProvider(mode);
    const payResult = await provider.createPayment({
      orderNo,
      amount,
      subject: product.name,
      userId: user.id,
    });

    let finalStatus = order.status;
    let paidAt: Date | null = null;

    if (payResult.success) {
      finalStatus = "PAID";
      paidAt = new Date();
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "PAID", paidAt },
      });
    }

    return NextResponse.json({
      ok: true,
      order: {
        id: order.id,
        orderNo: order.orderNo,
        amount: order.amount,
        status: finalStatus,
        productName: order.product.name,
        paidAt,
        payment: {
          provider: provider.name,
          success: payResult.success,
          paymentId: payResult.paymentId,
          message: payResult.message,
        },
      },
    });
  } catch (e) {
    console.error("create order error", e);
    return NextResponse.json(
      { error: "\u4e0b\u5355\u5931\u8d25", message: String(e) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/orders
 * - Logged in: list my orders
 * - Query orderNo: public query by order number
 */
export async function GET(req: NextRequest) {
  try {
    const orderNo = req.nextUrl.searchParams.get("orderNo")?.trim();
    const user = await getSessionUser();

    if (orderNo) {
      const order = await prisma.order.findUnique({
        where: { orderNo },
        include: {
          product: { select: { name: true, tags: true } },
          user: { select: { username: true } },
        },
      });
      if (!order) {
        return NextResponse.json({ error: "\u8ba2\u5355\u4e0d\u5b58\u5728" }, { status: 404 });
      }
      return NextResponse.json({
        order: {
          orderNo: order.orderNo,
          amount: order.amount,
          status: order.status,
          productName: order.product.name,
          createdAt: order.createdAt,
          paidAt: order.paidAt,
          remark: order.remark,
        },
      });
    }

    if (!user) {
      return NextResponse.json(
        { error: "\u8bf7\u5148\u767b\u5f55\u6216\u63d0\u4f9b orderNo" },
        { status: 401 }
      );
    }

    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        product: { select: { name: true } },
      },
    });

    return NextResponse.json({
      orders: orders.map((o) => ({
        id: o.id,
        orderNo: o.orderNo,
        amount: o.amount,
        status: o.status,
        productName: o.product.name,
        createdAt: o.createdAt,
        paidAt: o.paidAt,
      })),
    });
  } catch (e) {
    console.error("list orders error", e);
    return NextResponse.json(
      { error: "\u67e5\u8be2\u5931\u8d25", message: String(e) },
      { status: 500 }
    );
  }
}
