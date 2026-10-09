"use client";

import { useCallback, useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface OrderItem {
  id?: string;
  orderNo: string;
  amount: number;
  status: string;
  productName: string;
  createdAt: string;
  paidAt?: string | null;
  remark?: string;
}

const STATUS_MAP: Record<string, { text: string; color: string }> = {
  PENDING: { text: "\u5f85\u652f\u4ed8", color: "text-amber-600 bg-amber-50" },
  PAID: { text: "\u5df2\u652f\u4ed8", color: "text-green-600 bg-green-50" },
  DELIVERED: { text: "\u5df2\u53d1\u8d27", color: "text-blue-600 bg-blue-50" },
  COMPLETED: { text: "\u5df2\u5b8c\u6210", color: "text-gray-600 bg-gray-100" },
  CANCELLED: { text: "\u5df2\u53d6\u6d88", color: "text-gray-500 bg-gray-100" },
  REFUNDED: { text: "\u5df2\u9000\u6b3e", color: "text-red-600 bg-red-50" },
};

function OrdersContent() {
  const searchParams = useSearchParams();
  const [orderNo, setOrderNo] = useState("");
  const [queryResult, setQueryResult] = useState<OrderItem | null>(null);
  const [myOrders, setMyOrders] = useState<OrderItem[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [copied, setCopied] = useState("");

  const loadMyOrders = useCallback(async () => {
    setListLoading(true);
    try {
      const me = await fetch("/api/auth/me");
      if (!me.ok) {
        setLoggedIn(false);
        setMyOrders([]);
        return;
      }
      const meData = await me.json();
      if (!meData.user) {
        setLoggedIn(false);
        return;
      }
      setLoggedIn(true);
      const res = await fetch("/api/orders");
      const data = await res.json();
      setMyOrders(data.orders || []);
    } catch {
      setMyOrders([]);
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMyOrders();
  }, [loadMyOrders]);

  useEffect(() => {
    const q = searchParams.get("orderNo");
    if (q) {
      setOrderNo(q);
      (async () => {
        setLoading(true);
        setError("");
        try {
          const res = await fetch(
            "/api/orders?orderNo=" + encodeURIComponent(q)
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
      })();
    }
  }, [searchParams]);

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

  const copyOrderNo = async (no: string) => {
    try {
      await navigator.clipboard.writeText(no);
      setCopied(no);
      setTimeout(() => setCopied(""), 2000);
    } catch {
      // ignore
    }
  };

  const renderOrder = (o: OrderItem, highlight = false) => {
    const st = STATUS_MAP[o.status] || {
      text: o.status,
      color: "text-gray-600 bg-gray-50",
    };
    return (
      <div
        key={o.orderNo}
        className={`rounded-xl border bg-white p-4 shadow-sm ${
          highlight ? "border-indigo-300 ring-1 ring-indigo-100" : "border-gray-200"
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900">{o.productName}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <p className="text-xs text-gray-400">\u8ba2\u5355\u53f7\uff1a{o.orderNo}</p>
              <button
                type="button"
                onClick={() => copyOrderNo(o.orderNo)}
                className="text-xs text-indigo-600 hover:underline"
              >
                {copied === o.orderNo ? "\u5df2\u590d\u5236" : "\u590d\u5236"}
              </button>
            </div>
          </div>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${st.color}`}>
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
        {o.paidAt && (
          <p className="mt-1 text-xs text-gray-400">
            \u652f\u4ed8\u65f6\u95f4\uff1a{new Date(o.paidAt).toLocaleString("zh-CN")}
          </p>
        )}
        {o.remark && (
          <p className="mt-2 rounded bg-gray-50 px-2 py-1 text-xs text-gray-500">
            \u5907\u6ce8\uff1a{o.remark}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">\u8ba2\u5355\u67e5\u8be2</h1>
        <Link href="/" className="text-sm text-indigo-600 hover:underline">
          \u8fd4\u56de\u5546\u57ce
        </Link>
      </div>

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
        {queryResult && (
          <div className="mt-4">{renderOrder(queryResult, true)}</div>
        )}
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-medium text-gray-900">\u6211\u7684\u8ba2\u5355</h2>
          {loggedIn && (
            <button
              onClick={loadMyOrders}
              className="text-xs text-gray-500 hover:text-indigo-600"
            >
              \u5237\u65b0
            </button>
          )}
        </div>

        {listLoading ? (
          <p className="mt-3 text-sm text-gray-400">\u52a0\u8f7d\u4e2d...</p>
        ) : !loggedIn ? (
          <p className="mt-3 text-sm text-gray-500">
            <Link href="/login" className="text-indigo-600 hover:underline">
              \u767b\u5f55
            </Link>
            \u540e\u53ef\u67e5\u770b\u4e2a\u4eba\u8ba2\u5355\u5217\u8868
          </p>
        ) : myOrders.length === 0 ? (
          <div className="mt-3 rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center">
            <p className="text-sm text-gray-400">\u6682\u65e0\u8ba2\u5355</p>
            <Link
              href="/"
              className="mt-2 inline-block text-sm text-indigo-600 hover:underline"
            >
              \u53bb\u901b\u901b
            </Link>
          </div>
        ) : (
          <div className="mt-3 space-y-3">{myOrders.map((o) => renderOrder(o))}</div>
        )}
      </div>

      <div className="mt-8 rounded-lg bg-gray-50 px-4 py-3 text-xs text-gray-500">
        <p>\u8ba2\u5355\u72b6\u6001\u8bf4\u660e\uff1a\u5f85\u652f\u4ed8 \u2192 \u5df2\u652f\u4ed8 \u2192 \u5df2\u53d1\u8d27 \u2192 \u5df2\u5b8c\u6210</p>
        <p className="mt-1">\u6a21\u62df\u652f\u4ed8\u4e0b\u5355\u540e\u72b6\u6001\u4e3a\u300c\u5df2\u652f\u4ed8\u300d\uff0c\u53d1\u8d27\u7531\u7ba1\u7406\u5458\u5728\u540e\u53f0\u64cd\u4f5c\u3002</p>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-2xl px-4 py-8 text-sm text-gray-400">
          \u52a0\u8f7d\u4e2d...
        </div>
      }
    >
      <OrdersContent />
    </Suspense>
  );
}
