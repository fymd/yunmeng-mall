"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
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

interface CsConfig {
  site_name?: string;
  customer_service_qq?: string;
  customer_service_wechat?: string;
  customer_service_link?: string;
}

const STATUS_UI: Record<
  string,
  {
    title: string;
    desc: string;
    icon: string;
    ring: string;
    badge: string;
    headerBg: string;
  }
> = {
  PAID: {
    title: "支付成功",
    desc: "款项已确认，我们将尽快为您处理发货。",
    icon: "✓",
    ring: "bg-white text-emerald-600 shadow-md",
    badge: "text-emerald-700 bg-emerald-50",
    headerBg: "from-emerald-500 to-teal-600",
  },
  PENDING: {
    title: "等待支付确认",
    desc: "若已付款请稍候，本页会自动刷新；也可稍后在订单查询中查看。",
    icon: "⏳",
    ring: "bg-white text-amber-600 shadow-md",
    badge: "text-amber-700 bg-amber-50",
    headerBg: "from-amber-400 to-orange-500",
  },
  DELIVERED: {
    title: "已发货",
    desc: "商品已发货，请注意查收或查看订单备注中的发货信息。",
    icon: "📦",
    ring: "bg-white text-blue-600 shadow-md",
    badge: "text-blue-700 bg-blue-50",
    headerBg: "from-blue-500 to-indigo-600",
  },
  COMPLETED: {
    title: "订单已完成",
    desc: "感谢购买，欢迎再次光临。",
    icon: "★",
    ring: "bg-white text-indigo-600 shadow-md",
    badge: "text-gray-700 bg-gray-100",
    headerBg: "from-indigo-500 to-violet-600",
  },
  CANCELLED: {
    title: "订单已取消",
    desc: "该订单已取消。如有疑问请联系客服并提供订单号。",
    icon: "✕",
    ring: "bg-white text-gray-500 shadow-md",
    badge: "text-gray-600 bg-gray-100",
    headerBg: "from-gray-400 to-gray-500",
  },
  REFUNDED: {
    title: "已退款",
    desc: "退款已处理，到账时间以支付渠道为准。",
    icon: "↩",
    ring: "bg-white text-red-600 shadow-md",
    badge: "text-red-600 bg-red-50",
    headerBg: "from-red-400 to-rose-500",
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

const FLOW = ["PENDING", "PAID", "DELIVERED", "COMPLETED"] as const;

function stepIndex(status: string): number {
  if (status === "CANCELLED" || status === "REFUNDED") return -1;
  const i = FLOW.indexOf(status as (typeof FLOW)[number]);
  return i >= 0 ? i : 0;
}

function Timeline({ status }: { status: string }) {
  if (status === "CANCELLED" || status === "REFUNDED") {
    return (
      <div className="mt-5 rounded-lg border border-dashed border-gray-200 px-3 py-2 text-center text-xs text-gray-500">
        订单已结束（{STATUS_LABEL[status]}），不再进入发货流程
      </div>
    );
  }
  const active = stepIndex(status);
  const labels = ["下单", "支付", "发货", "完成"];
  return (
    <div className="mt-5">
      <p className="mb-2 text-xs font-medium text-gray-500">进度</p>
      <div className="flex items-center justify-between">
        {labels.map((label, i) => {
          const done = i <= active;
          return (
            <div key={label} className="flex flex-1 flex-col items-center">
              <div className="flex w-full items-center">
                {i > 0 && (
                  <div
                    className={`h-0.5 flex-1 ${i <= active ? "bg-indigo-500" : "bg-gray-200"}`}
                  />
                )}
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    done
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {done ? "✓" : i + 1}
                </div>
                {i < labels.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 ${i < active ? "bg-indigo-500" : "bg-gray-200"}`}
                  />
                )}
              </div>
              <span
                className={`mt-1.5 text-[10px] ${done ? "font-medium text-indigo-700" : "text-gray-400"}`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ResultContent() {
  const searchParams = useSearchParams();
  const orderNo = (searchParams.get("orderNo") || "").trim();
  const payUrl = searchParams.get("payUrl") || "";

  const [order, setOrder] = useState<OrderView | null>(null);
  const [cs, setCs] = useState<CsConfig>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [pollCount, setPollCount] = useState(0);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => (r.ok ? r.json() : {}))
      .then((c) => setCs(c || {}))
      .catch(() => {});
  }, []);

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

  const ui = useMemo(() => {
    if (order && STATUS_UI[order.status]) return STATUS_UI[order.status];
    return {
      title: loading ? "加载中" : "订单结果",
      desc: error || "请保存订单号以便查询",
      icon: "?",
      ring: "bg-white text-gray-600 shadow-md",
      badge: "text-gray-600 bg-gray-50",
      headerBg: "from-gray-400 to-gray-500",
    };
  }, [order, loading, error]);

  const qq = (cs.customer_service_qq || "").trim();
  const wechat = (cs.customer_service_wechat || "").trim();
  const link = (cs.customer_service_link || "").trim();
  const siteName = cs.site_name || "云梦AI代充";

  return (
    <div className="mx-auto max-w-md px-4 py-8 sm:px-6 sm:py-12">
      {/* Receipt card */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg print:shadow-none">
        {/* Colored header */}
        <div
          className={`bg-gradient-to-br ${ui.headerBg} px-6 pb-10 pt-8 text-center text-white`}
        >
          <p className="text-xs opacity-80">{siteName}</p>
          <div
            className={`mx-auto mt-4 flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold ${ui.ring}`}
          >
            {loading ? (
              <span className="animate-pulse text-sm text-gray-400">...</span>
            ) : (
              ui.icon
            )}
          </div>
          <h1 className="mt-4 text-xl font-semibold tracking-tight">{ui.title}</h1>
          <p className="mt-1.5 text-sm text-white/90">{ui.desc}</p>
          {order?.status === "PENDING" && pollCount < 40 && (
            <p className="mt-2 text-xs text-white/80">正在自动刷新状态…</p>
          )}
          {order && (order.status === "PAID" || order.status === "COMPLETED") && (
            <p className="mt-4 text-3xl font-bold tracking-tight">
              ¥{Number(order.amount).toFixed(2)}
            </p>
          )}
        </div>

        {/* Pull-up body */}
        <div className="relative -mt-4 rounded-t-2xl bg-white px-5 pb-6 pt-5 sm:px-6">
          {error && !order && (
            <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-600">
              {error}
            </p>
          )}

          {order && (
            <>
              <Timeline status={order.status} />

              <div className="mt-5 divide-y divide-gray-100 rounded-xl border border-gray-100 text-sm">
                <Row label="商品">
                  <span className="font-medium text-gray-900">
                    {order.productName}
                  </span>
                </Row>
                {order.status !== "PAID" && order.status !== "COMPLETED" && (
                  <Row label="金额">
                    <span className="text-base font-bold text-indigo-600">
                      ¥{Number(order.amount).toFixed(2)}
                    </span>
                  </Row>
                )}
                <Row label="状态">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs ${ui.badge}`}
                  >
                    {STATUS_LABEL[order.status] || order.status}
                  </span>
                </Row>
                <Row label="订单号">
                  <div className="text-right">
                    <p className="break-all font-mono text-xs text-gray-800">
                      {order.orderNo}
                    </p>
                    <button
                      type="button"
                      onClick={copyNo}
                      className="mt-0.5 text-xs text-indigo-600 hover:underline print:hidden"
                    >
                      {copied ? "已复制" : "复制"}
                    </button>
                  </div>
                </Row>
                <Row label="下单时间">
                  <span className="text-xs text-gray-700">
                    {new Date(order.createdAt).toLocaleString("zh-CN")}
                  </span>
                </Row>
                {order.paidAt && (
                  <Row label="支付时间">
                    <span className="text-xs text-gray-700">
                      {new Date(order.paidAt).toLocaleString("zh-CN")}
                    </span>
                  </Row>
                )}
                {order.remark && (
                  <div className="px-3 py-2.5">
                    <p className="text-xs text-gray-500">备注</p>
                    <p className="mt-1 whitespace-pre-wrap text-xs text-gray-800">
                      {order.remark}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          <div className="mt-5 flex flex-col gap-2 print:hidden">
            {order?.status === "PENDING" && payUrl && (
              <a
                href={payUrl}
                className="rounded-xl bg-emerald-600 py-2.5 text-center text-sm font-medium text-white hover:bg-emerald-700"
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
                className="rounded-xl border border-gray-300 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                刷新状态
              </button>
            )}
            <Link
              href={
                orderNo
                  ? `/orders?orderNo=${encodeURIComponent(orderNo)}`
                  : "/orders"
              }
              className="rounded-xl bg-indigo-600 py-2.5 text-center text-sm font-medium text-white hover:bg-indigo-700"
            >
              订单查询
            </Link>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/"
                className="rounded-xl border border-gray-300 py-2.5 text-center text-sm text-gray-700 hover:bg-gray-50"
              >
                返回商城
              </Link>
              <button
                type="button"
                onClick={() => window.print()}
                className="rounded-xl border border-gray-300 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                打印回执
              </button>
            </div>
          </div>

          {(qq || wechat || link) && (
            <div className="mt-5 rounded-xl bg-slate-50 px-3 py-3 text-xs text-gray-600 print:hidden">
              <p className="font-medium text-gray-800">需要帮助？</p>
              <ul className="mt-1.5 space-y-0.5">
                {qq && <li>QQ：{qq}</li>}
                {wechat && <li>微信：{wechat}</li>}
                {link && (
                  <li>
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:underline"
                    >
                      在线客服
                    </a>
                  </li>
                )}
              </ul>
              <p className="mt-1 text-gray-400">联系时请提供上方订单号</p>
            </div>
          )}
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-gray-400 print:hidden">
        <Link href="/help" className="text-indigo-600 hover:underline">
          帮助中心
        </Link>
        {" · "}
        请妥善保存订单号
      </p>
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 px-3 py-2.5">
      <span className="shrink-0 text-gray-500">{label}</span>
      <div className="min-w-0 text-right">{children}</div>
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
