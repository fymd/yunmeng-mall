"use client";

import { useCallback, useEffect, useState } from "react";

interface Category { id: string; name: string; }
interface Product {
  id: string; name: string; description: string; price: number;
  stockStatus: string; tags: string; enabled: boolean; categoryId: string;
  imageUrl?: string | null; autoDeliver?: boolean;
  category?: { id: string; name: string };
}

const STOCK_OPTIONS = [
  { value: "PLENTY", label: "非常多" },
  { value: "SUFFICIENT", label: "充足" },
  { value: "LOW", label: "即将售罄" },
  { value: "PREORDER", label: "可预订" },
  { value: "SOLD_OUT", label: "售罄" },
];
const STOCK_LABEL: Record<string, string> = Object.fromEntries(STOCK_OPTIONS.map((o) => [o.value, o.label]));
const emptyForm = {
  name: "", categoryId: "", price: "", description: "", stockStatus: "PLENTY",
  tags: "", enabled: true, imageUrl: "", autoDeliver: false,
};

export default function AdminProductsPage() {
  const [list, setList] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [filterCat, setFilterCat] = useState("all");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const params = new URLSearchParams({ all: "1", pageSize: "100" });
      if (filterCat !== "all") params.set("categoryId", filterCat);
      const [prodRes, catRes] = await Promise.all([
        fetch("/api/products?" + params.toString()),
        fetch("/api/categories?all=1"),
      ]);
      const prodData = await prodRes.json();
      const catData = await catRes.json();
      if (!prodRes.ok) { setError(prodData.error || "加载失败"); return; }
      setList(prodData.products || []);
      setCategories((catData.categories || []).map((c: Category) => ({ id: c.id, name: c.name })));
    } catch { setError("网络错误"); }
    finally { setLoading(false); }
  }, [filterCat]);

  useEffect(() => { load(); }, [load]);

  const resetForm = () => { setEditingId(null); setForm(emptyForm); setShowForm(false); };
  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm, categoryId: categories[0]?.id || "" });
    setShowForm(true);
  };
  const openEdit = (p: Product) => {
    setEditingId(p.id);
    setForm({
      name: p.name, categoryId: p.categoryId, price: String(p.price),
      description: p.description || "", stockStatus: p.stockStatus,
      tags: p.tags || "", enabled: p.enabled, imageUrl: p.imageUrl || "",
      autoDeliver: Boolean(p.autoDeliver),
    });
    setShowForm(true);
  };

  const handleUpload = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "上传失败"); return; }
      setForm((f) => ({ ...f, imageUrl: data.url }));
    } catch { setError("上传网络错误"); }
    finally { setUploading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.categoryId) return;
    setSaving(true); setError("");
    try {
      const payload = {
        name: form.name.trim(), categoryId: form.categoryId,
        price: Number(form.price), description: form.description,
        stockStatus: form.stockStatus, tags: form.tags, enabled: form.enabled,
        imageUrl: form.imageUrl || null, autoDeliver: form.autoDeliver,
      };
      if (editingId) {
        const res = await fetch("/api/products", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingId, ...payload }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error || "更新失败"); return; }
      } else {
        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error || "创建失败"); return; }
      }
      resetForm(); await load();
    } catch { setError("网络错误"); }
    finally { setSaving(false); }
  };

  const toggleEnabled = async (p: Product) => {
    try {
      const res = await fetch("/api/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: p.id, enabled: !p.enabled }),
      });
      if (res.ok) await load();
    } catch { setError("网络错误"); }
  };

  const handleDelete = async (p: Product) => {
    if (!confirm("确定删除商品「" + p.name + "」？")) return;
    try {
      const res = await fetch("/api/products", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: p.id }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "删除失败"); return; }
      if (data.softDeleted) alert(data.message);
      await load();
    } catch { setError("网络错误"); }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">商品管理</h1>
          <p className="mt-1 text-sm text-gray-500">支持图片上传与自动发货标记</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm">
            <option value="all">全部分类</option>
            {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
          </select>
          <button onClick={openCreate} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700">+ 新增商品</button>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}<button className="ml-2 text-xs underline" onClick={() => setError("")}>关闭</button>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
          <h2 className="text-sm font-medium text-gray-900">{editingId ? "编辑商品" : "新增商品"}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-gray-600">名称</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-indigo-500" required />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-600">分类</label>
              <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm" required>
                <option value="">请选择</option>
                {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-600">价格</label>
              <input type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm" required />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-600">库存状态</label>
              <select value={form.stockStatus} onChange={(e) => setForm({ ...form, stockStatus: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm">
                {STOCK_OPTIONS.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-600">标签（逗号分隔）</label>
              <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-gray-600">商品图片</label>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={(e) => handleUpload(e.target.files?.[0] || null)}
                  className="text-xs"
                />
                {uploading && <span className="text-xs text-gray-400">上传中…</span>}
                {form.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.imageUrl} alt="" className="h-14 w-14 rounded object-cover border" />
                )}
              </div>
              <input
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                placeholder="或填写图片 URL"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-gray-600">描述</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm" />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} className="rounded border-gray-300" />
              上架
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={form.autoDeliver} onChange={(e) => setForm({ ...form, autoDeliver: e.target.checked })} className="rounded border-gray-300" />
              卡密自动发货
            </label>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm text-white disabled:opacity-50">{saving ? "保存中..." : "保存"}</button>
            <button type="button" onClick={resetForm} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm">取消</button>
          </div>
        </form>
      )}

      <div className="mt-6 overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">商品</th>
              <th className="px-4 py-3">分类</th>
              <th className="px-4 py-3">价格</th>
              <th className="px-4 py-3">库存</th>
              <th className="px-4 py-3">状态</th>
              <th className="px-4 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading && (<tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">加载中...</td></tr>)}
            {!loading && list.length === 0 && (<tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">暂无商品</td></tr>)}
            {!loading && list.map((p) => (
              <tr key={p.id} className="border-b border-gray-50 last:border-0">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {p.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.imageUrl} alt="" className="h-8 w-8 rounded object-cover" />
                    )}
                    <div>
                      <p className="max-w-[180px] truncate font-medium">{p.name}</p>
                      {p.autoDeliver && <span className="text-[10px] text-emerald-600">自动发货</span>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600">{p.category?.name || "—"}</td>
                <td className="px-4 py-3">¥{Number(p.price).toFixed(2)}</td>
                <td className="px-4 py-3">{STOCK_LABEL[p.stockStatus] || p.stockStatus}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${p.enabled ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {p.enabled ? "上架" : "下架"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => openEdit(p)} className="text-xs text-indigo-600 hover:underline">编辑</button>{" "}
                  <button onClick={() => toggleEnabled(p)} className="text-xs text-gray-600 hover:underline">{p.enabled ? "下架" : "上架"}</button>{" "}
                  <button onClick={() => handleDelete(p)} className="text-xs text-red-600 hover:underline">删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
