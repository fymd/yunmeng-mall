"use client";

import { useCallback, useEffect, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import ProductDetailModal from "@/components/product/ProductDetailModal";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stockStatus: string;
  tags: string;
  categoryId: string;
  category?: { id: string; name: string };
}

const STOCK_LABEL: Record<string, { text: string; color: string }> = {
  PLENTY: { text: "非常多", color: "text-green-600 bg-green-50" },
  SUFFICIENT: { text: "充足", color: "text-emerald-600 bg-emerald-50" },
  LOW: { text: "即将售罄", color: "text-orange-600 bg-orange-50" },
  PREORDER: { text: "可预订", color: "text-blue-600 bg-blue-50" },
  SOLD_OUT: { text: "售罄", color: "text-gray-500 bg-gray-100" },
};

export default function HomePage() {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detail, setDetail] = useState<Product | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [buying, setBuying] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<{
    orderNo: string;
    productName: string;
    amount: number;
    remark?: string;
    status?: string;
    payUrl?: string;
    paymentMessage?: string;
  } | null>(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (categoryId && categoryId !== "all") params.set("categoryId", categoryId);
      if (query) params.set("q", query);
      const res = await fetch("/api/products?" + params.toString());
      const data = await res.json();
      setProducts(data.products || []);
      if (data.error) setError(data.error);
    } catch {
      setError("加载商品失败");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [categoryId, query]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const openDetail = async (p: Product) => {
    try {
      const res = await fetch("/api/products/" + p.id);
      const data = await res.json();
      setDetail(data.product || p);
    } catch {
      setDetail(p);
    }
    setDetailOpen(true);
  };

  const handleBuy = async (p: Product, remark: string) => {
    if (buying) return;
    setBuying(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: p.id, remark }),
      });
      const data = await res.json();
      if (res.status === 401) {
        setDetailOpen(false);
        window.location.href = "/login";
        return;
      }
      if (!res.ok) {
        alert(data.error || "下单失败");
        return;
      }
      setDetailOpen(false);
      const pay = data.order?.payment;
      setOrderSuccess({
        orderNo: data.order.orderNo,
        productName: data.order.productName,
        amount: data.order.amount,
        remark: data.order.remark || remark || undefined,
        status: data.order.status,
        payUrl: pay?.payUrl,
        paymentMessage: pay?.message,
      });
      if (pay?.payUrl && typeof window !== "undefined") {
        // Optional: open payment page for real/skeleton gateways
        // window.open(pay.payUrl, "_blank");
      }
    } catch {
      alert("网络错误，请重试");
    } finally {
      setBuying(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-7xl flex-col md:flex-row">
      <Sidebar activeId={categoryId} onSelect={setCategoryId} />

      <div className="flex-1 p-4 sm:p-6">
        <div className="mb-4 flex gap-2 sm:mb-6">
          <input
            type="search"
            placeholder="搜索商品关键词"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && setQuery(search.trim())}
            className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:px-4"
          />
          <button
            onClick={() => setQuery(search.trim())}
            className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 sm:px-5"
          >
            搜索
          </button>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="hidden grid-cols-12 gap-2 border-b border-gray-100 bg-gray-50 px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 sm:grid">
            <div className="col-span-7">商品</div>
            <div className="col-span-2 text-right">价格</div>
            <div className="col-span-2 text-center">库存</div>
            <div className="col-span-1 text-center">操作</div>
          </div>

          {loading && (
            <div className="px-4 py-12 text-center text-sm text-gray-400">加载中...</div>
          )}

          {!loading && error && (
            <div className="px-4 py-8 text-center text-sm text-amber-600">{error}</div>
          )}

          {!loading && !error && products.length === 0 && (
            <div className="px-4 py-12 text-center text-sm text-gray-400">暂无匹配商品</div>
          )}

          {!loading &&
            products.map((p) => {
              const stock = STOCK_LABEL[p.stockStatus] || {
                text: p.stockStatus,
                color: "text-gray-600 bg-gray-50",
              };
              const tags = p.tags
                ? p.tags.split(",").map((t) => t.trim()).filter(Boolean)
                : [];

              return (
                <div
                  key={p.id}
                  className="flex flex-col gap-2 border-b border-gray-50 px-4 py-3 last:border-0 hover:bg-gray-50/50 sm:grid sm:grid-cols-12 sm:items-center sm:gap-2"
                >
                  <div
                    className="cursor-pointer sm:col-span-7"
                    onClick={() => openDetail(p)}
                  >
                    <p className="text-sm font-medium text-gray-900 line-clamp-2 hover:text-indigo-600">
                      {p.name}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {tags.map((t) => (
                        <span
                          key={t}
                          className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:col-span-5 sm:contents">
                    <div className="text-sm font-semibold text-gray-900 sm:col-span-2 sm:text-right">
                      ¥{Number(p.price).toFixed(2)}
                    </div>
                    <div className="sm:col-span-2 sm:text-center">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs ${stock.color}`}>
                        {stock.text}
                      </span>
                    </div>
                    <div className="sm:col-span-1 sm:text-center">
                      <button
                        onClick={() => openDetail(p)}
                        className="rounded-md bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                        disabled={p.stockStatus === "SOLD_OUT"}
                      >
                        {p.stockStatus === "PREORDER" ? "预订" : "购买"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      <ProductDetailModal
        product={detail}
        open={detailOpen}
        onClose={() => !buying && setDetailOpen(false)}
        onBuy={handleBuy}
        buying={buying}
      />

      {orderSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOrderSuccess(null)}
          />
          <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
            <div className="text-3xl">
              {orderSuccess.status === "PAID" ? "✅" : "⏳"}
            </div>
            <h3 className="mt-2 text-lg font-semibold text-gray-900">
              {orderSuccess.status === "PAID" ? "下单成功" : "订单已创建"}
            </h3>
            <p className="mt-1 text-sm text-gray-600">{orderSuccess.productName}</p>
            <p className="mt-2 text-xl font-bold text-indigo-600">
              ¥{Number(orderSuccess.amount).toFixed(2)}
            </p>
            <p className="mt-2 break-all text-xs text-gray-400">
              订单号：{orderSuccess.orderNo}
            </p>
            {orderSuccess.remark && (
              <p className="mt-2 rounded-lg bg-gray-50 px-2 py-1.5 text-left text-xs text-gray-600">
                备注：{orderSuccess.remark}
              </p>
            )}
            {orderSuccess.status === "PAID" ? (
              <p className="mt-1 text-xs text-green-600">模拟支付已完成</p>
            ) : (
              <p className="mt-1 text-xs text-amber-600">
                {orderSuccess.paymentMessage || "请完成支付（订单待支付）"}
              </p>
            )}
            <div className="mt-4 flex flex-col gap-2">
              {orderSuccess.payUrl && (
                <a
                  href={orderSuccess.payUrl}
                  className="rounded-lg bg-emerald-600 py-2 text-center text-sm text-white hover:bg-emerald-700"
                >
                  前往支付
                </a>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => setOrderSuccess(null)}
                  className="flex-1 rounded-lg border border-gray-300 py-2 text-sm"
                >
                  继续购物
                </button>
                <a
                  href={"/orders?orderNo=" + encodeURIComponent(orderSuccess.orderNo)}
                  className="flex-1 rounded-lg bg-indigo-600 py-2 text-center text-sm text-white"
                >
                  查看订单
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
