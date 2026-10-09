"use client";

import { useCallback, useEffect, useState } from "react";

interface OrderItem {
  id: string;
  orderNo: string;
  amount: number;
  status: string;
  remark: string;
  productName: string;
  username: string;
  createdAt: string;
  paidAt?: string | null;
  updatedAt?: string;
}

const STATUS_OPTIONS = [
  { value: "PENDING", label: "待支付" },
  { value: "PAID", label: "已支付" },
  { value: "DELIVERED", label: "已发货" },
  { value: "COMPLETED", label: "已完成" },
  { value: "CANCELLED", label: "已取消" },
  { value: "REFUNDED", label: "已退款" },
];

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  PAID: "bg-green-50 text-green-700",
  DELIVERED: "bg-blue-50 text-blue-700",
  COMPLETED: "bg-gray-100 text-gray-600",
  CANCELLED: "bg-gray-100 text-gray-500",
  REFUNDED: "bg-red-50 text-red-600",
};

const STATUS_LABEL: Record<string, string> = Object.fromEntries(
  STATUS_OPTIONS.map((o) => [o.value, o.label])
);

export default function AdminOrdersPage() {
  const [list, setList] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [q, setQ] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [editRemarkId, setEditRemarkId] = useState<string | null>(null);
  const [remarkDraft, setRemarkDraft] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        all: "1",
        page: String(page),
        pageSize: "20",
      });
      if (filterStatus !== "all") params.set("status", filterStatus);
      if (q) params.set("q", q);
      const res = await fetch("/api/orders?" + params.toString());
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "加载失败");
        return;
      }
      setList(data.orders || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch {
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  }, [filterStatus, q, page]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSearch = () => {
    setPage(1);
    setQ(searchInput.trim());
  };

  const updateOrder = async (
    id: string,
    payload: { status?: string; remark?: string }
  ) => {
    setSavingId(id);
    setError("");
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...payload }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "更新失败");
        return;
      }
      await load();
    } catch {
      setError("网络错误");
    } finally {
      setSavingId(null);
    }
  };

  const handleStatusChange = (order: OrderItem, newStatus: string) => {
    if (newStatus === order.status) return;
    const label = STATUS_LABEL[newStatus] || newStatus;
    if (
      !confirm(
        `将订单 ${order.orderNo} 状态改为「${label}」？`
      )
    ) {
      return;
    }
    updateOrder(order.id, { status: newStatus });
  };

  const openRemark = (order: OrderItem) => {
    setEditRemarkId(order.id);
    setRemarkDraft(order.remark || "");
  };

  const saveRemark = async (id: string) => {
    await updateOrder(id, { remark: remarkDraft });
    setEditRemarkId(null);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">订单管理</h1>
          <p className="mt-1 text-sm text-gray-500">
            查看订单、修改状态与备注（共 {total} 条）
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
          >
            <option value="all">全部状态</option>
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="订单号 / 用户 / 商品 / 备注"
            className="w-48 rounded-lg border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-indigo-500 sm:w-56"
          />
          <button
            onClick={handleSearch}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            搜索
          </button>
          <button
            onClick={() => load()}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            刷新
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
          <button
            className="ml-2 text-xs underline"
            onClick={() => setError("")}
          >
            关闭
          </button>
        </div>
      )}

      <div className="mt-6 overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">订单号</th>
              <th className="px-4 py-3">商品 / 用户</th>
              <th className="px-4 py-3">金额</th>
              <th className="px-4 py-3">状态</th>
              <th className="px-4 py-3">时间</th>
              <th className="px-4 py-3">备注</th>
              <th className="px-4 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  加载中...
                </td>
              </tr>
            )}
            {!loading && list.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  暂无订单
                </td>
              </tr>
            )}
            {!loading &&
              list.map((o) => (
                <tr
                  key={o.id}
                  className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50"
                >
                  <td className="px-4 py-3">
                    <p className="font-mono text-xs text-gray-900">{o.orderNo}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="max-w-[160px] truncate font-medium text-gray-900">
                      {o.productName}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-400">{o.username}</p>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    ¥{Number(o.amount).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={o.status}
                      disabled={savingId === o.id}
                      onChange={(e) => handleStatusChange(o, e.target.value)}
                      className={`rounded-full border-0 px-2 py-0.5 text-xs outline-none ${STATUS_STYLE[o.status] || "bg-gray-50 text-gray-600"}`}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    <p>{new Date(o.createdAt).toLocaleString("zh-CN")}</p>
                    {o.paidAt && (
                      <p className="mt-0.5 text-gray-400">
                        付: {new Date(o.paidAt).toLocaleString("zh-CN")}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editRemarkId === o.id ? (
                      <div className="flex flex-col gap-1">
                        <textarea
                          value={remarkDraft}
                          onChange={(e) => setRemarkDraft(e.target.value)}
                          rows={2}
                          className="w-40 rounded border border-gray-300 px-2 py-1 text-xs outline-none focus:border-indigo-500"
                          placeholder="发货信息、备注..."
                        />
                        <div className="flex gap-1">
                          <button
                            onClick={() => saveRemark(o.id)}
                            disabled={savingId === o.id}
                            className="text-xs text-indigo-600 hover:underline disabled:opacity-50"
                          >
                            保存
                          </button>
                          <button
                            onClick={() => setEditRemarkId(null)}
                            className="text-xs text-gray-500 hover:underline"
                          >
                            取消
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p
                        className="max-w-[140px] truncate text-xs text-gray-500"
                        title={o.remark || undefined}
                      >
                        {o.remark || "—"}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      {editRemarkId !== o.id && (
                        <button
                          onClick={() => openRemark(o)}
                          className="text-xs text-indigo-600 hover:underline"
                        >
                          备注
                        </button>
                      )}
                      {o.status === "PAID" && (
                        <button
                          onClick={() => handleStatusChange(o, "DELIVERED")}
                          disabled={savingId === o.id}
                          className="text-xs text-blue-600 hover:underline disabled:opacity-50"
                        >
                          发货
                        </button>
                      )}
                      {o.status === "DELIVERED" && (
                        <button
                          onClick={() => handleStatusChange(o, "COMPLETED")}
                          disabled={savingId === o.id}
                          className="text-xs text-green-600 hover:underline disabled:opacity-50"
                        >
                          完成
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-lg border border-gray-300 px-3 py-1 text-sm disabled:opacity-40"
          >
            上一页
          </button>
          <span className="text-sm text-gray-500">
            {page} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="rounded-lg border border-gray-300 px-3 py-1 text-sm disabled:opacity-40"
          >
            下一页
          </button>
        </div>
      )}

      <div className="mt-6 rounded-lg bg-gray-50 px-4 py-3 text-xs text-gray-500">
        <p>
          状态流转建议：待支付 → 已支付 → 已发货 → 已完成；可取消或退款。
        </p>
        <p className="mt-1">
          模拟支付下单后默认为「已支付」，请在此标记发货并填写备注（如卡密、账号信息）。
        </p>
      </div>
    </div>
  );
}
