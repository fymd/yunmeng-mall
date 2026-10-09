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
      fetch("/api/products?pageSize=1").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/orders")
        .then((r) => r.json())
        .catch(() => ({ orders: [] })),
    ])
      .then(([products, categories, orders]) => {
        const list = orders.orders || [];
        setStats({
          products: products.total ?? (products.products?.length || 0),
          categories: categories.categories?.length || 0,
          orders: list.length,
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
      label: "\u5546\u54c1\u6570",
      value: stats?.products,
      href: "/admin/products",
      color: "bg-indigo-50 text-indigo-700",
    },
    {
      label: "\u5206\u7c7b\u6570",
      value: stats?.categories,
      href: "/admin/categories",
      color: "bg-violet-50 text-violet-700",
    },
    {
      label: "\u8fd1\u671f\u8ba2\u5355",
      value: stats?.orders,
      href: "/admin/orders",
      color: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "\u5f85\u5904\u7406",
      value: stats?.pendingOrders,
      href: "/admin/orders",
      color: "bg-amber-50 text-amber-700",
    },
  ];

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900">\u6982\u89c8</h1>
      <p className="mt-1 text-sm text-gray-500">
        \u6b22\u8fce\u4f7f\u7528\u4e91\u68a6\u5546\u57ce\u7ba1\u7406\u540e\u53f0\u3002\u8bf7\u4f7f\u7528\u5de6\u4fa7\u83dc\u5355\u7ba1\u7406\u5206\u7c7b\u3001\u5546\u54c1\u4e0e\u8ba2\u5355\u3002
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className={`rounded-xl p-4 transition hover:opacity-90 ${c.color}`}
          >
            <p className="text-xs font-medium opacity-80">{c.label}</p>
            <p className="mt-1 text-2xl font-bold">
              {loading ? "\u2014" : c.value ?? 0}
            </p>
          </Link>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="text-sm font-medium text-gray-900">\u5feb\u6377\u5165\u53e3</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href="/admin/products"
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700"
          >
            \u7ba1\u7406\u5546\u54c1
          </Link>
          <Link
            href="/admin/orders"
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            \u5904\u7406\u8ba2\u5355
          </Link>
          <Link
            href="/admin/config"
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            \u7ad9\u70b9\u914d\u7f6e
          </Link>
        </div>
      </div>

      <p className="mt-6 text-xs text-gray-400">
        \u7ba1\u7406\u5458\u8d26\u53f7\uff1aadmin / admin123\uff08\u8bf7\u5728\u751f\u4ea7\u73af\u5883\u4fee\u6539\u5bc6\u7801\uff09
      </p>
    </div>
  );
}
