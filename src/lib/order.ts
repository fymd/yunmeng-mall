/**
 * Order helpers — pure functions safe for unit tests
 */

export const ORDER_STATUSES = [
  "PENDING",
  "PAID",
  "DELIVERED",
  "COMPLETED",
  "CANCELLED",
  "REFUNDED",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "待支付",
  PAID: "已支付",
  DELIVERED: "已发货",
  COMPLETED: "已完成",
  CANCELLED: "已取消",
  REFUNDED: "已退款",
};

/** Suggested forward transitions for admin UI hints */
export const ORDER_STATUS_FLOW: Partial<Record<OrderStatus, OrderStatus[]>> = {
  PENDING: ["PAID", "CANCELLED"],
  PAID: ["DELIVERED", "REFUNDED", "CANCELLED"],
  DELIVERED: ["COMPLETED", "REFUNDED"],
  COMPLETED: [],
  CANCELLED: [],
  REFUNDED: [],
};

export function isValidOrderStatus(status: string): status is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(status);
}

export function generateOrderNo(now: Date = new Date()): string {
  const pad = (n: number, len = 2) => String(n).padStart(len, "0");
  const date =
    now.getFullYear().toString() +
    pad(now.getMonth() + 1) +
    pad(now.getDate()) +
    pad(now.getHours()) +
    pad(now.getMinutes()) +
    pad(now.getSeconds());
  const rand = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `YM${date}${rand}`;
}

export function isOrderNoFormat(orderNo: string): boolean {
  return /^YM\d{14}\d{4}$/.test(orderNo);
}

/**
 * Parse order_timeout_minutes config.
 * Returns minutes; 0 or invalid → timeout disabled.
 */
export function parseOrderTimeoutMinutes(raw: string | undefined | null): number {
  if (raw === undefined || raw === null || raw === "") return 0;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(Math.floor(n), 60 * 24 * 7); // max 7 days
}

/** Whether a PENDING order created at `createdAt` has exceeded timeout. */
export function isPendingOrderExpired(
  createdAt: Date,
  timeoutMinutes: number,
  now: Date = new Date()
): boolean {
  if (timeoutMinutes <= 0) return false;
  const deadline = createdAt.getTime() + timeoutMinutes * 60 * 1000;
  return now.getTime() >= deadline;
}

export function timeoutCancelRemark(
  existingRemark: string,
  timeoutMinutes: number
): string {
  const note = `[系统] 超过 ${timeoutMinutes} 分钟未支付，已自动取消`;
  const base = (existingRemark || "").trim();
  if (!base) return note;
  if (base.includes("[系统] 超过")) return base;
  return `${base}\n${note}`;
}
