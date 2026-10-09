import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { generateOrderNo, isValidOrderStatus, ORDER_STATUSES } from "@/lib/order";
import { getPaymentProvider } from "@/lib/payment";
import { getConfig } from "@/lib/config";

type OrderStatusType = (typeof ORDER_STATUSES)[number];

const MAX_REMARK_LEN = 500;

function sanitizeRemark(raw: unknown): string {
  if (raw === undefined || raw === null) return "";
  return String(raw).trim().slice(0, MAX_REMARK_LEN);
}

async function requireAdmin() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") return null;
  return user;
}

/**
 * POST /api/orders
 * Body: { productId, remark? }
 * Requires login. Creates order + runs mock payment.
 * remark: user note e.g. recharge account email (max 500 chars)
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { error: "请先登录", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { productId } = body as { productId?: string; remark?: string };
    if (!productId) {
      return NextResponse.json({ error: "缺少 productId" }, { status: 400 });
    }

    const remark = sanitizeRemark(body.remark);

    const product = await prisma.product.findFirst({
      where: { id: productId, enabled: true },
    });
    if (!product) {
      return NextResponse.json({ error: "商品不存在或已下架" }, { status: 404 });
    }
    if (product.stockStatus === "SOLD_OUT") {
      return NextResponse.json({ error: "商品已售罄" }, { status: 400 });
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
        remark,
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
        remark: order.remark,
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
      { error: "下单失败", message: String(e) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/orders
 * - orderNo: public query by order number
 * - all=1 (admin): list all orders with optional status / q filters
 * - logged in (non-admin): list my orders
 */
export async function GET(req: NextRequest) {
  try {
    const orderNo = req.nextUrl.searchParams.get("orderNo")?.trim();
    const all = req.nextUrl.searchParams.get("all") === "1";
    const statusFilter = req.nextUrl.searchParams.get("status")?.trim();
    const q = req.nextUrl.searchParams.get("q")?.trim();
    const page = Math.max(1, Number(req.nextUrl.searchParams.get("page") || 1));
    const pageSize = Math.min(
      100,
      Math.max(1, Number(req.nextUrl.searchParams.get("pageSize") || 20))
    );
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
        return NextResponse.json({ error: "订单不存在" }, { status: 404 });
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

    if (all) {
      const admin = await requireAdmin();
      if (!admin) {
        return NextResponse.json({ error: "无权限" }, { status: 403 });
      }

      const where: {
        status?: OrderStatusType;
        OR?: Array<
          | { orderNo: { contains: string } }
          | { remark: { contains: string } }
          | { user: { username: { contains: string } } }
          | { product: { name: { contains: string } } }
        >;
      } = {};

      if (statusFilter && isValidOrderStatus(statusFilter)) {
        where.status = statusFilter;
      }
      if (q) {
        where.OR = [
          { orderNo: { contains: q } },
          { remark: { contains: q } },
          { user: { username: { contains: q } } },
          { product: { name: { contains: q } } },
        ];
      }

      const [total, orders] = await Promise.all([
        prisma.order.count({ where }),
        prisma.order.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
          include: {
            product: { select: { id: true, name: true } },
            user: { select: { id: true, username: true } },
          },
        }),
      ]);

      return NextResponse.json({
        orders: orders.map((o) => ({
          id: o.id,
          orderNo: o.orderNo,
          amount: o.amount,
          status: o.status,
          remark: o.remark,
          productId: o.productId,
          productName: o.product.name,
          userId: o.userId,
          username: o.user.username,
          createdAt: o.createdAt,
          paidAt: o.paidAt,
          updatedAt: o.updatedAt,
        })),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      });
    }

    if (!user) {
      return NextResponse.json(
        { error: "请先登录或提供 orderNo" },
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
        remark: o.remark,
      })),
    });
  } catch (e) {
    console.error("list orders error", e);
    return NextResponse.json(
      { error: "查询失败", message: String(e) },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/orders
 * Admin only. Body: { id, status?, remark? }
 * Update order status and/or remark. Sets paidAt when moving to PAID.
 * Admin remark update can append delivery info; prefer not to erase user remark blindly.
 */
export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const body = await req.json();
    const id = String(body.id || "");
    if (!id) {
      return NextResponse.json({ error: "缺少 id" }, { status: 400 });
    }

    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "订单不存在" }, { status: 404 });
    }

    const data: {
      status?: OrderStatusType;
      remark?: string;
      paidAt?: Date | null;
    } = {};

    if (body.status !== undefined) {
      const status = String(body.status);
      if (!isValidOrderStatus(status)) {
        return NextResponse.json(
          { error: "无效的订单状态: " + status },
          { status: 400 }
        );
      }
      data.status = status;

      if (status === "PAID" && !existing.paidAt) {
        data.paidAt = new Date();
      }
    }

    if (body.remark !== undefined) {
      data.remark = sanitizeRemark(body.remark);
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "无更新字段" }, { status: 400 });
    }

    const order = await prisma.order.update({
      where: { id },
      data,
      include: {
        product: { select: { name: true } },
        user: { select: { username: true } },
      },
    });

    return NextResponse.json({
      ok: true,
      order: {
        id: order.id,
        orderNo: order.orderNo,
        amount: order.amount,
        status: order.status,
        remark: order.remark,
        productName: order.product.name,
        username: order.user.username,
        createdAt: order.createdAt,
        paidAt: order.paidAt,
        updatedAt: order.updatedAt,
      },
    });
  } catch (e) {
    console.error("orders PATCH error", e);
    return NextResponse.json(
      { error: "更新失败", message: String(e) },
      { status: 500 }
    );
  }
}
