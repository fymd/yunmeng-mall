"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Stats {
  products: number;
  categories: number;
  orders: number;
  revenue: number;
  cardsUnused: number;
  unreadChat: number;
  statusMap: Record<string, number>;
  last7Days: { date: string; count: number; revenue: number }[];
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: "待支付",
  PAID: "已支付",
  DELIVERED: "已发货",
  COMPLETED: "已完成",
  CANCELLED: "已取消",
  REFUNDED: "已退款",
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) setStats(d);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const maxDay = Math.max(
    1,
    ...(stats?.last7Days.map((d) => d.count) || [1])
  );

  const statusEntries = Object.entries(stats?.statusMap || {});
  const maxStatus = Math.max(1, ...statusEntries.map(([, n]) => n));

  const cards = [
    {
      label: "商品数",
      value: stats?.products,
      href: "/admin/products",
      color: "bg-indigo-50 text-indigo-700",
    },
    {
      label: "订单总数",
      value: stats?.orders,
      href: "/admin/orders",
      color: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "成交额",
      value: stats ? `¥${Number(stats.revenue).toFixed(0)}` : undefined,
      href: "/admin/orders",
      color: "bg-violet-50 text-violet-700",
    },
    {
      label: "未读留言",
      value: stats?.unreadChat,
      href: "/admin/messages",
      color: "bg-amber-50 text-amber-700",
    },
  ];

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900">概览</h1>
      <p className="mt-1 text-sm text-gray-500">
        数据报表与快捷入口。卡密可用 {loading ? "—" : stats?.cardsUnused ?? 0} 张。
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className={`rounded-xl p-4 transition hover:opacity-90 ${c.color}`}
          >
            <p className="text-xs font-medium opacity-80">{c.label}</p>
            <p className="mt-1 text-2xl font-bold">
              {loading ? "—" : (c.value ?? 0)}
            </p>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="text-sm font-medium text-gray-900">近 7 日订单量</h2>
          <div className="mt-4 flex h-36 items-end gap-1.5">
            {(stats?.last7Days || []).map((d) => (
              <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-indigo-500/80 transition-all"
                  style={{
                    height: `${Math.max(4, (d.count / maxDay) * 100)}%`,
                  }}
                  title={`${d.count} 单`}
                />
                <span className="text-[9px] text-gray-400">
                  {d.date.slice(5)}
                </span>
              </div>
            ))}
            {!stats?.last7Days?.length && !loading && (
              <p className="w-full text-center text-xs text-gray-400">暂无数据</p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="text-sm font-medium text-gray-900">订单状态分布</h2>
          <div className="mt-3 space-y-2">
            {statusEntries.length === 0 && !loading && (
              <p className="text-xs text-gray-400">暂无订单</p>
            )}
            {statusEntries.map(([k, n]) => (
              <div key={k}>
                <div className="mb-0.5 flex justify-between text-xs text-gray-600">
                  <span>{STATUS_LABEL[k] || k}</span>
                  <span>{n}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${(n / maxStatus) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="text-sm font-medium text-gray-900">快捷入口</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href="/admin/products"
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700"
          >
            管理商品
          </Link>
          <Link
            href="/admin/cards"
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            卡密发货
          </Link>
          <Link
            href="/admin/orders"
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            处理订单
          </Link>
          <Link
            href="/admin/messages"
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            客服留言
          </Link>
          <Link
            href="/admin/config"
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            站点配置
          </Link>
        </div>
      </div>
    </div>
  );
}
