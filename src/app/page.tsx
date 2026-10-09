"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";

const PLACEHOLDER_PRODUCTS = [
  {
    id: "1",
    name: "最新ChatGPT 25X 500 美刀官方充值",
    price: 3324.5,
    stockStatus: "即将售罄",
    stockColor: "text-orange-600 bg-orange-50",
    tags: ["官方充值", "自动发货"],
  },
  {
    id: "2",
    name: "gpt 学生认证代认证（1天左右开通好）",
    price: 119.9,
    stockStatus: "可预订",
    stockColor: "text-blue-600 bg-blue-50",
    tags: ["代开通", "自动发货"],
  },
  {
    id: "3",
    name: "gpt 5x/50x成品 非官方充值（质保2天）",
    price: 515.57,
    stockStatus: "非常多",
    stockColor: "text-green-600 bg-green-50",
    tags: ["成品账号", "在线发货"],
  },
  {
    id: "4",
    name: "Claude Pro 官方充值",
    price: 199.0,
    stockStatus: "充足",
    stockColor: "text-emerald-600 bg-emerald-50",
    tags: ["官方充值"],
  },
  {
    id: "5",
    name: "推特蓝V认证代开",
    price: 88.0,
    stockStatus: "非常多",
    stockColor: "text-green-600 bg-green-50",
    tags: ["代开通"],
  },
];

export default function HomePage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const filtered = PLACEHOLDER_PRODUCTS.filter((p) => {
    const matchSearch =
      !search || p.name.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  return (
    <div className="mx-auto flex max-w-7xl flex-col md:flex-row">
      <Sidebar activeId={category} onSelect={setCategory} />

      <div className="flex-1 p-4 sm:p-6">
        <div className="mb-6 flex gap-2">
          <input
            type="text"
            placeholder="搜索商品关键词"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
          <button className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            搜索
          </button>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="grid grid-cols-12 gap-2 border-b border-gray-100 bg-gray-50 px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">
            <div className="col-span-6 sm:col-span-7">商品</div>
            <div className="col-span-2 text-right">价格</div>
            <div className="col-span-2 hidden text-center sm:block">库存</div>
            <div className="col-span-2 text-center sm:col-span-1">操作</div>
          </div>

          {filtered.length === 0 ? (
            <div className="px-4 py-12 text-center text-sm text-gray-400">
              暂无匹配商品
            </div>
          ) : (
            filtered.map((p) => (
              <div
                key={p.id}
                className="grid grid-cols-12 items-center gap-2 border-b border-gray-50 px-4 py-3 last:border-0 hover:bg-gray-50/50"
              >
                <div className="col-span-6 sm:col-span-7">
                  <p className="text-sm font-medium text-gray-900 line-clamp-2">
                    {p.name}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {p.tags.map((t) => (
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
                  ¥{p.price.toFixed(2)}
                </div>
                <div className="col-span-2 hidden text-center sm:block">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs ${p.stockColor}`}
                  >
                    {p.stockStatus}
                  </span>
                </div>
                <div className="col-span-2 text-center sm:col-span-1">
                  <button className="rounded-md bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-700">
                    购买
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <p className="mt-4 text-center text-xs text-gray-400">
          以上为占位数据，T6–T7 将接入真实 API
        </p>
      </div>
    </div>
  );
}
