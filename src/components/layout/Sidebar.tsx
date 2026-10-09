"use client";

import { useEffect, useState } from "react";

interface Category {
  id: string;
  name: string;
  sort: number;
  productCount?: number;
}

interface SidebarProps {
  activeId?: string;
  onSelect?: (id: string) => void;
}

const ICONS: Record<string, string> = {
  GPT: "\ud83e\udd16",
  Claude: "\u2728",
  "\u63a8\u7279": "\ud835\udd4f",
  default: "\ud83d\udce6",
};

export default function Sidebar({ activeId = "all", onSelect }: SidebarProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [active, setActive] = useState(activeId);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => {
        setCategories(data.categories || []);
      })
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }, []);

  const handleClick = (id: string) => {
    setActive(id);
    onSelect?.(id);
  };

  return (
    <aside className="w-full shrink-0 border-r border-gray-200 bg-white md:w-56">
      <div className="p-4">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
          \u5546\u54c1\u5206\u7c7b
        </h2>
        <ul className="space-y-1">
          <li>
            <button
              onClick={() => handleClick("all")}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                active === "all"
                  ? "bg-indigo-50 font-medium text-indigo-700"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <span className="text-base">\ud83d\udce6</span>
              \u5168\u90e8\u5546\u54c1
            </button>
          </li>

          {loading && (
            <li className="px-3 py-2 text-xs text-gray-400">\u52a0\u8f7d\u4e2d...</li>
          )}

          {!loading && categories.length === 0 && (
            <li className="px-3 py-2 text-xs text-gray-400">
              \u6682\u65e0\u5206\u7c7b\uff08\u8bf7\u5148 seed \u6570\u636e\u5e93\uff09
            </li>
          )}

          {categories.map((cat) => (
            <li key={cat.id}>
              <button
                onClick={() => handleClick(cat.id)}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  active === cat.id
                    ? "bg-indigo-50 font-medium text-indigo-700"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span className="text-base">
                  {ICONS[cat.name] || ICONS.default}
                </span>
                <span className="flex-1 truncate">{cat.name}</span>
                {typeof cat.productCount === "number" && (
                  <span className="text-xs text-gray-400">
                    {cat.productCount}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
