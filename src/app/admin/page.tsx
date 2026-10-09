"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Stats {
  products: number;
  categories: number;
  orders: number;
  pendingOrders: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/products?all=1&pageSize=1").then((r) => r.json()),
      fetch("/api/categories?all=1").then((r) => r.json()),
      fetch("/api/orders?all=1&pageSize=100").then((r) => r.json()),
    ])
      .then(([products, categories, ordersData]) => {
        const list = ordersData.orders || [];
        setStats({
          products: products.total ?? (products.products?.length || 0),
          categories: categories.categories?.length || 0,
          orders: ordersData.total ?? list.length,
          pendingOrders: list.filter(
            (o: { status: string }) =>
              o.status === "PENDING" || o.status === "PAID"
          ).length,
        });
      })
      .catch(() => {
        setStats({ products: 0, categories: 0, orders: 0, pendingOrders: 0 });
      })
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    {
      label: "商品数",
      value: stats?.products,
      href: "/admin/products",
      color: "bg-indigo-50 text-indigo-700",
    },
    {
      label: "分类数",
      value: stats?.categories,
      href: "/admin/categories",
      color: "bg-violet-50 text-violet-700",
    },
    {
      label: "订单总数",
      value: stats?.orders,
      href: "/admin/orders",
      color: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "待处理",
      value: stats?.pendingOrders,
      href: "/admin/orders",
      color: "bg-amber-50 text-amber-700",
    },
  ];

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900">概览</h1>
      <p className="mt-1 text-sm text-gray-500">
        欢迎使用云梦商城管理后台。请使用左侧菜单管理分类、商品与订单。
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
              {loading ? "—" : c.value ?? 0}
            </p>
          </Link>
        ))}
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
            href="/admin/orders"
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            处理订单
          </Link>
          <Link
            href="/admin/config"
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            站点配置
          </Link>
          <Link
            href="/"
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            查看前台
          </Link>
        </div>
      </div>

      <p className="mt-6 text-xs text-gray-400">
        默认管理员：admin / admin123（生产环境请立即修改密码）
      </p>
    </div>
  );
}
