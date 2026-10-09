"use client";

import { useCallback, useEffect, useState } from "react";

interface Category {
  id: string;
  name: string;
  sort: number;
  enabled: boolean;
  productCount: number;
  createdAt?: string;
}

export default function AdminCategoriesPage() {
  const [list, setList] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [sort, setSort] = useState(0);
  const [enabled, setEnabled] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/categories?all=1");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "\u52a0\u8f7d\u5931\u8d25");
        return;
      }
      setList(data.categories || []);
    } catch {
      setError("\u7f51\u7edc\u9519\u8bef");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setSort(0);
    setEnabled(true);
    setShowForm(false);
  };

  const openCreate = () => {
    setEditingId(null);
    setName("");
    setSort(list.length > 0 ? Math.max(...list.map((c) => c.sort), 0) + 1 : 1);
    setEnabled(true);
    setShowForm(true);
  };

  const openEdit = (c: Category) => {
    setEditingId(c.id);
    setName(c.name);
    setSort(c.sort);
    setEnabled(c.enabled);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError("");
    try {
      if (editingId) {
        const res = await fetch("/api/categories", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingId, name, sort, enabled }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "\u66f4\u65b0\u5931\u8d25");
          return;
        }
      } else {
        const res = await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, sort, enabled }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "\u521b\u5efa\u5931\u8d25");
          return;
        }
      }
      resetForm();
      await load();
    } catch {
      setError("\u7f51\u7edc\u9519\u8bef");
    } finally {
      setSaving(false);
    }
  };

  const toggleEnabled = async (c: Category) => {
    try {
      const res = await fetch("/api/categories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: c.id, enabled: !c.enabled }),
      });
      if (res.ok) await load();
      else {
        const data = await res.json();
        setError(data.error || "\u64cd\u4f5c\u5931\u8d25");
      }
    } catch {
      setError("\u7f51\u7edc\u9519\u8bef");
    }
  };

  const handleDelete = async (c: Category) => {
    if (!confirm("\u786e\u5b9a\u5220\u9664\u5206\u7c7b\u300c" + c.name + "\u300d\uff1f")) return;
    try {
      const res = await fetch("/api/categories", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: c.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "\u5220\u9664\u5931\u8d25");
        return;
      }
      await load();
    } catch {
      setError("\u7f51\u7edc\u9519\u8bef");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">\u5206\u7c7b\u7ba1\u7406</h1>
          <p className="mt-1 text-sm text-gray-500">
            \u65b0\u589e\u3001\u7f16\u8f91\u3001\u6392\u5e8f\u4e0e\u542f\u7528/\u7981\u7528\u5206\u7c7b
          </p>
        </div>
        <button
          onClick={openCreate}
          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + \u65b0\u589e\u5206\u7c7b
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
          <button className="ml-2 text-xs underline" onClick={() => setError("")}>
            \u5173\u95ed
          </button>
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4"
        >
          <h2 className="text-sm font-medium text-gray-900">
            {editingId ? "\u7f16\u8f91\u5206\u7c7b" : "\u65b0\u589e\u5206\u7c7b"}
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs text-gray-600">\u540d\u79f0</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-indigo-500"
                required
                placeholder="\u4f8b\u5982 GPT"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-600">\u6392\u5e8f</label>
              <input
                type="number"
                value={sort}
                onChange={(e) => setSort(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="rounded border-gray-300"
                />
                \u542f\u7528
              </label>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? "\u4fdd\u5b58\u4e2d..." : "\u4fdd\u5b58"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              \u53d6\u6d88
            </button>
          </div>
        </form>
      )}

      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">\u540d\u79f0</th>
              <th className="px-4 py-3">\u6392\u5e8f</th>
              <th className="px-4 py-3">\u5546\u54c1\u6570</th>
              <th className="px-4 py-3">\u72b6\u6001</th>
              <th className="px-4 py-3 text-right">\u64cd\u4f5c</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  \u52a0\u8f7d\u4e2d...
                </td>
              </tr>
            )}
            {!loading && list.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  \u6682\u65e0\u5206\u7c7b\uff0c\u70b9\u51fb\u4e0a\u65b9\u300c\u65b0\u589e\u5206\u7c7b\u300d
                </td>
              </tr>
            )}
            {!loading &&
              list.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50"
                >
                  <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                  <td className="px-4 py-3 text-gray-600">{c.sort}</td>
                  <td className="px-4 py-3 text-gray-600">{c.productCount}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        c.enabled
                          ? "bg-green-50 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {c.enabled ? "\u542f\u7528" : "\u7981\u7528"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEdit(c)}
                        className="text-xs text-indigo-600 hover:underline"
                      >
                        \u7f16\u8f91
                      </button>
                      <button
                        onClick={() => toggleEnabled(c)}
                        className="text-xs text-gray-600 hover:underline"
                      >
                        {c.enabled ? "\u7981\u7528" : "\u542f\u7528"}
                      </button>
                      <button
                        onClick={() => handleDelete(c)}
                        className="text-xs text-red-600 hover:underline disabled:opacity-40"
                        disabled={c.productCount > 0}
                        title={
                          c.productCount > 0
                            ? "\u5206\u7c7b\u4e0b\u6709\u5546\u54c1\uff0c\u65e0\u6cd5\u5220\u9664"
                            : "\u5220\u9664"
                        }
                      >
                        \u5220\u9664
                      </button>
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
