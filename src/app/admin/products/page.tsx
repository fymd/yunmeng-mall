"use client";

import { useCallback, useEffect, useState } from "react";

interface Category { id: string; name: string; }
interface Product {
  id: string; name: string; description: string; price: number;
  stockStatus: string; tags: string; enabled: boolean; categoryId: string;
  category?: { id: string; name: string };
}

const STOCK_OPTIONS = [
  { value: "PLENTY", label: "\u975e\u5e38\u591a" },
  { value: "SUFFICIENT", label: "\u5145\u8db3" },
  { value: "LOW", label: "\u5373\u5c06\u552e\u7f44" },
  { value: "PREORDER", label: "\u53ef\u9884\u8ba2" },
  { value: "SOLD_OUT", label: "\u552e\u7f44" },
];
const STOCK_LABEL: Record<string, string> = Object.fromEntries(STOCK_OPTIONS.map((o) => [o.value, o.label]));
const emptyForm = { name: "", categoryId: "", price: "", description: "", stockStatus: "PLENTY", tags: "", enabled: true };

export default function AdminProductsPage() {
  const [list, setList] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
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
      if (!prodRes.ok) { setError(prodData.error || "\u52a0\u8f7d\u5931\u8d25"); return; }
      setList(prodData.products || []);
      setCategories((catData.categories || []).map((c: Category) => ({ id: c.id, name: c.name })));
    } catch { setError("\u7f51\u7edc\u9519\u8bef"); }
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
    setForm({ name: p.name, categoryId: p.categoryId, price: String(p.price), description: p.description || "", stockStatus: p.stockStatus, tags: p.tags || "", enabled: p.enabled });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.categoryId) return;
    setSaving(true); setError("");
    try {
      const payload = { name: form.name.trim(), categoryId: form.categoryId, price: Number(form.price), description: form.description, stockStatus: form.stockStatus, tags: form.tags, enabled: form.enabled };
      if (editingId) {
        const res = await fetch("/api/products", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editingId, ...payload }) });
        const data = await res.json();
        if (!res.ok) { setError(data.error || "\u66f4\u65b0\u5931\u8d25"); return; }
      } else {
        const res = await fetch("/api/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        const data = await res.json();
        if (!res.ok) { setError(data.error || "\u521b\u5efa\u5931\u8d25"); return; }
      }
      resetForm(); await load();
    } catch { setError("\u7f51\u7edc\u9519\u8bef"); }
    finally { setSaving(false); }
  };

  const toggleEnabled = async (p: Product) => {
    try {
      const res = await fetch("/api/products", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: p.id, enabled: !p.enabled }) });
      if (res.ok) await load();
      else { const data = await res.json(); setError(data.error || "\u64cd\u4f5c\u5931\u8d25"); }
    } catch { setError("\u7f51\u7edc\u9519\u8bef"); }
  };

  const handleDelete = async (p: Product) => {
    if (!confirm("\u786e\u5b9a\u5220\u9664\u5546\u54c1\u300c" + p.name + "\u300d\uff1f\n\u82e5\u5df2\u6709\u8ba2\u5355\u5c06\u81ea\u52a8\u4e0b\u67b6\u3002")) return;
    try {
      const res = await fetch("/api/products", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: p.id }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "\u5220\u9664\u5931\u8d25"); return; }
      if (data.softDeleted) alert(data.message);
      await load();
    } catch { setError("\u7f51\u7edc\u9519\u8bef"); }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">\u5546\u54c1\u7ba1\u7406</h1>
          <p className="mt-1 text-sm text-gray-500">\u65b0\u589e\u3001\u7f16\u8f91\u3001\u4e0a\u67b6/\u4e0b\u67b6\u5546\u54c1</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm">
            <option value="all">\u5168\u90e8\u5206\u7c7b</option>
            {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
          </select>
          <button onClick={openCreate} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700">+ \u65b0\u589e\u5546\u54c1</button>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}<button className="ml-2 text-xs underline" onClick={() => setError("")} >\u5173\u95ed</button>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
          <h2 className="text-sm font-medium text-gray-900">{editingId ? "\u7f16\u8f91\u5546\u54c1" : "\u65b0\u589e\u5546\u54c1"}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-gray-600">\u540d\u79f0</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-indigo-500" required />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-600">\u5206\u7c7b</label>
              <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm" required>
                <option value="">\u8bf7\u9009\u62e9</option>
                {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-600">\u4ef7\u683c</label>
              <input type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-indigo-500" required />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-600">\u5e93\u5b58\u72b6\u6001</label>
              <select value={form.stockStatus} onChange={(e) => setForm({ ...form, stockStatus: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm">
                {STOCK_OPTIONS.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-600">\u6807\u7b7e\uff08\u9017\u53f7\u5206\u9694\uff09</label>
              <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-indigo-500" placeholder="\u5b98\u65b9\u5145\u503c,\u81ea\u52a8\u53d1\u8d27" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-gray-600">\u63cf\u8ff0</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} className="rounded border-gray-300" />
                \u4e0a\u67b6\uff08\u524d\u53f0\u53ef\u89c1\uff09
              </label>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700 disabled:opacity-50">{saving ? "\u4fdd\u5b58\u4e2d..." : "\u4fdd\u5b58"}</button>
            <button type="button" onClick={resetForm} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">\u53d6\u6d88</button>
          </div>
        </form>
      )}

      <div className="mt-6 overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">\u5546\u54c1</th>
              <th className="px-4 py-3">\u5206\u7c7b</th>
              <th className="px-4 py-3">\u4ef7\u683c</th>
              <th className="px-4 py-3">\u5e93\u5b58</th>
              <th className="px-4 py-3">\u72b6\u6001</th>
              <th className="px-4 py-3 text-right">\u64cd\u4f5c</th>
            </tr>
          </thead>
          <tbody>
            {loading && (<tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">\u52a0\u8f7d\u4e2d...</td></tr>)}
            {!loading && list.length === 0 && (<tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">\u6682\u65e0\u5546\u54c1</td></tr>)}
            {!loading && list.map((p) => (
              <tr key={p.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                <td className="px-4 py-3">
                  <p className="max-w-[200px] truncate font-medium text-gray-900">{p.name}</p>
                  {p.tags && <p className="mt-0.5 truncate text-xs text-gray-400">{p.tags}</p>}
                </td>
                <td className="px-4 py-3 text-gray-600">{p.category?.name || "\u2014"}</td>
                <td className="px-4 py-3 font-medium text-gray-900">\u00a5{Number(p.price).toFixed(2)}</td>
                <td className="px-4 py-3 text-gray-600">{STOCK_LABEL[p.stockStatus] || p.stockStatus}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${p.enabled ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {p.enabled ? "\u4e0a\u67b6" : "\u4e0b\u67b6"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => openEdit(p)} className="text-xs text-indigo-600 hover:underline">\u7f16\u8f91</button>
                    <button onClick={() => toggleEnabled(p)} className="text-xs text-gray-600 hover:underline">{p.enabled ? "\u4e0b\u67b6" : "\u4e0a\u67b6"}</button>
                    <button onClick={() => handleDelete(p)} className="text-xs text-red-600 hover:underline">\u5220\u9664</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
