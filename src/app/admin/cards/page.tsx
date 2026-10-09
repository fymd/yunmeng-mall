"use client";

import { useCallback, useEffect, useState } from "react";

interface Product {
  id: string;
  name: string;
  autoDeliver?: boolean;
}

interface CardRow {
  id: string;
  code: string;
  codeFull: string;
  status: string;
  productName: string;
  orderNo: string | null;
  createdAt: string;
}

export default function AdminCardsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState("");
  const [codes, setCodes] = useState("");
  const [list, setList] = useState<CardRow[]>([]);
  const [unused, setUnused] = useState(0);
  const [sold, setSold] = useState(0);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const loadProducts = useCallback(async () => {
    const res = await fetch("/api/products?all=1&pageSize=100");
    const data = await res.json();
    const ps = data.products || [];
    setProducts(ps);
    if (!productId && ps[0]) setProductId(ps[0].id);
  }, [productId]);

  const loadCards = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ pageSize: "80" });
      if (productId) params.set("productId", productId);
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch("/api/cards?" + params.toString());
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "加载失败");
        return;
      }
      setList(data.cards || []);
      setUnused(data.unused ?? 0);
      setSold(data.sold ?? 0);
    } catch {
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  }, [productId, statusFilter]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    if (productId) loadCards();
  }, [productId, loadCards]);

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !codes.trim()) return;
    setSaving(true);
    setError("");
    setMsg("");
    try {
      const res = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, codes, enableAutoDeliver: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "导入失败");
        return;
      }
      setMsg(`成功导入 ${data.created} 条，跳过 ${data.skipped}，剩余可用 ${data.unused}`);
      setCodes("");
      await loadCards();
      await loadProducts();
    } catch {
      setError("网络错误");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("删除/作废该卡密？")) return;
    const res = await fetch("/api/cards", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) loadCards();
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">卡密发货</h1>
          <p className="mt-1 text-sm text-gray-500">
            导入卡密后，开启自动发货的商品在支付成功时会自动分配一条卡密并标记已发货
          </p>
        </div>
        <div className="text-sm text-gray-600">
          可用 <span className="font-semibold text-emerald-600">{unused}</span>
          {" · "}
          已售 <span className="font-semibold">{sold}</span>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
      )}
      {msg && (
        <div className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{msg}</div>
      )}

      <form
        onSubmit={handleImport}
        className="mt-6 space-y-3 rounded-xl border border-gray-200 bg-white p-4"
      >
        <h2 className="text-sm font-medium text-gray-900">批量导入</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-gray-600">商品</label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
              required
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.autoDeliver ? "（已开自动发货）" : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs text-gray-600">
              卡密列表（每行一条，或逗号分隔）
            </label>
            <textarea
              value={codes}
              onChange={(e) => setCodes(e.target.value)}
              rows={5}
              placeholder={"CARD-AAAA-1111\nCARD-BBBB-2222"}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm outline-none focus:border-indigo-500"
              required
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? "导入中..." : "导入并开启自动发货"}
        </button>
      </form>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
        >
          <option value="all">全部状态</option>
          <option value="UNUSED">未使用</option>
          <option value="SOLD">已售出</option>
          <option value="VOID">已作废</option>
        </select>
        <button
          type="button"
          onClick={loadCards}
          className="text-sm text-indigo-600 hover:underline"
        >
          刷新
        </button>
      </div>

      <div className="mt-3 overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-gray-100 bg-gray-50 text-xs text-gray-500">
            <tr>
              <th className="px-4 py-3">卡密</th>
              <th className="px-4 py-3">商品</th>
              <th className="px-4 py-3">状态</th>
              <th className="px-4 py-3">订单</th>
              <th className="px-4 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  加载中...
                </td>
              </tr>
            )}
            {!loading && list.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  暂无卡密，请先导入
                </td>
              </tr>
            )}
            {!loading &&
              list.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-gray-50 last:border-0"
                >
                  <td className="px-4 py-2 font-mono text-xs">
                    {c.status === "UNUSED" ? c.codeFull : c.code}
                  </td>
                  <td className="px-4 py-2 text-gray-600">{c.productName}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        c.status === "UNUSED"
                          ? "bg-emerald-50 text-emerald-700"
                          : c.status === "SOLD"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {c.status === "UNUSED"
                        ? "未使用"
                        : c.status === "SOLD"
                          ? "已售"
                          : "作废"}
                    </span>
                  </td>
                  <td className="px-4 py-2 font-mono text-xs text-gray-500">
                    {c.orderNo || "—"}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => handleDelete(c.id)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      {c.status === "SOLD" ? "作废" : "删除"}
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
