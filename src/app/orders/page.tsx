"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface OrderItem {
  id?: string;
  orderNo: string;
  amount: number;
  status: string;
  productName: string;
  createdAt: string;
  paidAt?: string | null;
}

const STATUS_MAP: Record<string, { text: string; color: string }> = {
  PENDING: { text: "\u5f85\u652f\u4ed8", color: "text-amber-600 bg-amber-50" },
  PAID: { text: "\u5df2\u652f\u4ed8", color: "text-green-600 bg-green-50" },
  DELIVERED: { text: "\u5df2\u53d1\u8d27", color: "text-blue-600 bg-blue-50" },
  COMPLETED: { text: "\u5df2\u5b8c\u6210", color: "text-gray-600 bg-gray-100" },
  CANCELLED: { text: "\u5df2\u53d6\u6d88", color: "text-gray-500 bg-gray-100" },
  REFUNDED: { text: "\u5df2\u9000\u6b3e", color: "text-red-600 bg-red-50" },
};

export default function OrdersPage() {
  const [orderNo, setOrderNo] = useState("");
  const [queryResult, setQueryResult] = useState<OrderItem | null>(null);
  const [myOrders, setMyOrders] = useState<OrderItem[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : { user: null }))
      .then((data) => {
        if (data.user) {
          setLoggedIn(true);
          return fetch("/api/orders").then((r) => r.json());
        }
        return null;
      })
      .then((data) => {
        if (data?.orders) setMyOrders(data.orders);
      })
      .catch(() => {});
  }, []);

  const handleQuery = async () => {
    if (!orderNo.trim()) return;
    setLoading(true);
    setError("");
    setQueryResult(null);
    try {
      const res = await fetch(
        "/api/orders?orderNo=" + encodeURIComponent(orderNo.trim())
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "\u67e5\u8be2\u5931\u8d25");
        return;
      }
      setQueryResult(data.order);
    } catch {
      setError("\u7f51\u7edc\u9519\u8bef");
    } finally {
      setLoading(false);
    }
  };

  const renderOrder = (o: OrderItem) => {
    const st = STATUS_MAP[o.status] || {
      text: o.status,
      color: "text-gray-600 bg-gray-50",
    };
    return (
      <div
        key={o.orderNo}
        className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-medium text-gray-900">{o.productName}</p>
            <p className="mt-1 text-xs text-gray-400">\u8ba2\u5355\u53f7\uff1a{o.orderNo}</p>
          </div>
          <span className={`rounded-full px-2 py-0.5 text-xs ${st.color}`}>
            {st.text}
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="font-semibold text-indigo-600">
            \u00a5{Number(o.amount).toFixed(2)}
          </span>
          <span className="text-xs text-gray-400">
            {new Date(o.createdAt).toLocaleString("zh-CN")}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="text-xl font-semibold text-gray-900">\u8ba2\u5355\u67e5\u8be2</h1>

      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <p className="text-sm text-gray-600">\u8f93\u5165\u8ba2\u5355\u53f7\u67e5\u8be2\uff08\u65e0\u9700\u767b\u5f55\uff09</p>
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={orderNo}
            onChange={(e) => setOrderNo(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleQuery()}
            placeholder="\u4f8b\u5982 YM202610091200001234"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
          />
          <button
            onClick={handleQuery}
            disabled={loading}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "\u67e5\u8be2\u4e2d" : "\u67e5\u8be2"}
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        {queryResult && <div className="mt-4">{renderOrder(queryResult)}</div>}
      </div>

      <div className="mt-8">
        <h2 className="text-base font-medium text-gray-900">\u6211\u7684\u8ba2\u5355</h2>
        {!loggedIn ? (
          <p className="mt-3 text-sm text-gray-500">
            <Link href="/login" className="text-indigo-600 hover:underline">
              \u767b\u5f55
            </Link>
            \u540e\u53ef\u67e5\u770b\u4e2a\u4eba\u8ba2\u5355\u5217\u8868
          </p>
        ) : myOrders.length === 0 ? (
          <p className="mt-3 text-sm text-gray-400">\u6682\u65e0\u8ba2\u5355</p>
        ) : (
          <div className="mt-3 space-y-3">{myOrders.map(renderOrder)}</div>
        )}
      </div>
    </div>
  );
}
