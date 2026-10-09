"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface OrderView {
  orderNo: string;
  amount: number;
  status: string;
  productName: string;
  createdAt: string;
  paidAt?: string | null;
  remark?: string;
}

const STATUS_UI: Record<
  string,
  { title: string; desc: string; icon: string; ring: string; badge: string }
> = {
  PAID: {
    title: "支付成功",
    desc: "订单已支付，我们将尽快为您处理发货。",
    icon: "✓",
    ring: "bg-emerald-100 text-emerald-700",
    badge: "text-emerald-700 bg-emerald-50",
  },
  PENDING: {
    title: "等待支付确认",
    desc: "若已付款，请稍候；状态将自动刷新。也可稍后在订单查询中查看。",
    icon: "…",
    ring: "bg-amber-100 text-amber-700",
    badge: "text-amber-700 bg-amber-50",
  },
  DELIVERED: {
    title: "已发货",
    desc: "商品已发货，请注意查收或查看订单备注。",
    icon: "📦",
    ring: "bg-blue-100 text-blue-700",
    badge: "text-blue-700 bg-blue-50",
  },
  COMPLETED: {
    title: "订单已完成",
    desc: "感谢购买，欢迎再次光临。",
    icon: "✓",
    ring: "bg-gray-100 text-gray-700",
    badge: "text-gray-700 bg-gray-100",
  },
  CANCELLED: {
    title: "订单已取消",
    desc: "该订单已取消，如有疑问请联系客服。",
    icon: "✕",
    ring: "bg-gray-100 text-gray-500",
    badge: "text-gray-600 bg-gray-100",
  },
  REFUNDED: {
    title: "已退款",
    desc: "退款已处理，到账时间以支付渠道为准。",
    icon: "↩",
    ring: "bg-red-100 text-red-600",
    badge: "text-red-600 bg-red-50",
  },
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "待支付",
  PAID: "已支付",
  DELIVERED: "已发货",
  COMPLETED: "已完成",
  CANCELLED: "已取消",
  REFUNDED: "已退款",
};

function ResultContent() {
  const searchParams = useSearchParams();
  const orderNo = (searchParams.get("orderNo") || "").trim();
  const payUrl = searchParams.get("payUrl") || "";

  const [order, setOrder] = useState<OrderView | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [pollCount, setPollCount] = useState(0);

  const load = useCallback(async () => {
    if (!orderNo) {
      setError("缺少订单号");
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(
        "/api/orders?orderNo=" + encodeURIComponent(orderNo)
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "查询失败");
        setOrder(null);
        return;
      }
      setOrder(data.order);
      setError("");
    } catch {
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  }, [orderNo]);

  useEffect(() => {
    load();
  }, [load]);

  // Poll while PENDING (max ~2 min)
  useEffect(() => {
    if (!order || order.status !== "PENDING") return;
    if (pollCount >= 40) return;
    const t = setTimeout(() => {
      setPollCount((c) => c + 1);
      load();
    }, 3000);
    return () => clearTimeout(t);
  }, [order, pollCount, load]);

  const copyNo = async () => {
    if (!orderNo) return;
    try {
      await navigator.clipboard.writeText(orderNo);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const ui =
    order && STATUS_UI[order.status]
      ? STATUS_UI[order.status]
      : {
          title: loading ? "加载中" : "订单结果",
          desc: error || "请保存订单号以便查询",
          icon: "?",
          ring: "bg-gray-100 text-gray-600",
          badge: "text-gray-600 bg-gray-50",
        };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-10 sm:px-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col items-center text-center">
          <div
            className={`flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold ${ui.ring}`}
          >
            {loading ? (
              <span className="animate-pulse text-sm">...</span>
            ) : (
              ui.icon
            )}
          </div>
          <h1 className="mt-4 text-xl font-semibold text-gray-900">{ui.title}</h1>
          <p className="mt-2 text-sm text-gray-500">{ui.desc}</p>
          {order?.status === "PENDING" && pollCount < 40 && (
            <p className="mt-1 text-xs text-amber-600">正在自动刷新状态…</p>
          )}
        </div>

        {error && !order && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-600">
            {error}
          </p>
        )}

        {order && (
          <div className="mt-6 space-y-3 rounded-xl bg-gray-50 p-4 text-left text-sm">
            <div className="flex justify-between gap-2">
              <span className="text-gray-500">商品</span>
              <span className="max-w-[60%] text-right font-medium text-gray-900">
                {order.productName}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-gray-500">金额</span>
              <span className="text-lg font-bold text-indigo-600">
                ¥{Number(order.amount).toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-gray-500">状态</span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs ${ui.badge}`}
              >
                {STATUS_LABEL[order.status] || order.status}
              </span>
            </div>
            <div className="flex items-start justify-between gap-2">
              <span className="shrink-0 text-gray-500">订单号</span>
              <div className="text-right">
                <p className="break-all font-mono text-xs text-gray-800">
                  {order.orderNo}
                </p>
                <button
                  type="button"
                  onClick={copyNo}
                  className="mt-0.5 text-xs text-indigo-600 hover:underline"
                >
                  {copied ? "已复制" : "复制订单号"}
                </button>
              </div>
            </div>
            {order.paidAt && (
              <div className="flex justify-between gap-2">
                <span className="text-gray-500">支付时间</span>
                <span className="text-xs text-gray-700">
                  {new Date(order.paidAt).toLocaleString("zh-CN")}
                </span>
              </div>
            )}
            {order.remark && (
              <div>
                <p className="text-gray-500">备注</p>
                <p className="mt-0.5 whitespace-pre-wrap text-xs text-gray-700">
                  {order.remark}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2">
          {order?.status === "PENDING" && payUrl && (
            <a
              href={payUrl}
              className="rounded-lg bg-emerald-600 py-2.5 text-center text-sm font-medium text-white hover:bg-emerald-700"
            >
              继续支付
            </a>
          )}
          {order?.status === "PENDING" && (
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                load();
              }}
              className="rounded-lg border border-gray-300 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              刷新状态
            </button>
          )}
          <Link
            href={orderNo ? `/orders?orderNo=${encodeURIComponent(orderNo)}` : "/orders"}
            className="rounded-lg bg-indigo-600 py-2.5 text-center text-sm font-medium text-white hover:bg-indigo-700"
          >
            订单详情
          </Link>
          <Link
            href="/"
            className="rounded-lg border border-gray-300 py-2.5 text-center text-sm text-gray-700 hover:bg-gray-50"
          >
            返回商城
          </Link>
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-gray-400">
        支付遇到问题？请到「帮助中心」联系客服，并提供订单号。
      </p>
    </div>
  );
}

export default function PayResultPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center text-sm text-gray-400">
          加载中...
        </div>
      }
    >
      <ResultContent />
    </Suspense>
  );
}
