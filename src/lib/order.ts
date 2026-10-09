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
