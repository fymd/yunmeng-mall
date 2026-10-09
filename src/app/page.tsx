"use client";

import { useCallback, useEffect, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";

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
  PLENTY: { text: "\u975e\u5e38\u591a", color: "text-green-600 bg-green-50" },
  SUFFICIENT: { text: "\u5145\u8db3", color: "text-emerald-600 bg-emerald-50" },
  LOW: { text: "\u5373\u5c06\u552e\u7f44", color: "text-orange-600 bg-orange-50" },
  PREORDER: { text: "\u53ef\u9884\u8ba2", color: "text-blue-600 bg-blue-50" },
  SOLD_OUT: { text: "\u552e\u7f44", color: "text-gray-500 bg-gray-100" },
};

export default function HomePage() {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
      setError("\u52a0\u8f7d\u5546\u54c1\u5931\u8d25");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [categoryId, query]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleSearch = () => {
    setQuery(search.trim());
  };

  return (
    <div className="mx-auto flex max-w-7xl flex-col md:flex-row">
      <Sidebar activeId={categoryId} onSelect={setCategoryId} />

      <div className="flex-1 p-4 sm:p-6">
        <div className="mb-6 flex gap-2">
          <input
            type="text"
            placeholder="\u641c\u7d22\u5546\u54c1\u5173\u952e\u8bcd"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
          <button
            onClick={handleSearch}
            className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            \u641c\u7d22
          </button>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="grid grid-cols-12 gap-2 border-b border-gray-100 bg-gray-50 px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">
            <div className="col-span-6 sm:col-span-7">\u5546\u54c1</div>
            <div className="col-span-2 text-right">\u4ef7\u683c</div>
            <div className="col-span-2 hidden text-center sm:block">\u5e93\u5b58</div>
            <div className="col-span-2 text-center sm:col-span-1">\u64cd\u4f5c</div>
          </div>

          {loading && (
            <div className="px-4 py-12 text-center text-sm text-gray-400">
              \u52a0\u8f7d\u4e2d...
            </div>
          )}

          {!loading && error && (
            <div className="px-4 py-8 text-center text-sm text-amber-600">
              {error}
            </div>
          )}

          {!loading && !error && products.length === 0 && (
            <div className="px-4 py-12 text-center text-sm text-gray-400">
              \u6682\u65e0\u5339\u914d\u5546\u54c1
            </div>
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
                  className="grid grid-cols-12 items-center gap-2 border-b border-gray-50 px-4 py-3 last:border-0 hover:bg-gray-50/50"
                >
                  <div className="col-span-6 sm:col-span-7">
                    <p className="text-sm font-medium text-gray-900 line-clamp-2">
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
                  <div className="col-span-2 text-right text-sm font-semibold text-gray-900">
                    \u00a5{Number(p.price).toFixed(2)}
                  </div>
                  <div className="col-span-2 hidden text-center sm:block">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs ${stock.color}`}
                    >
                      {stock.text}
                    </span>
                  </div>
                  <div className="col-span-2 text-center sm:col-span-1">
                    <button
                      className="rounded-md bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                      disabled={p.stockStatus === "SOLD_OUT"}
                    >
                      {p.stockStatus === "PREORDER" ? "\u9884\u8ba2" : "\u8d2d\u4e70"}
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
