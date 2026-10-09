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
  GPT: "🤖",
  Claude: "✨",
  推特: "𝕏",
  其它: "📦",
  default: "📦",
};

export default function Sidebar({ activeId = "all", onSelect }: SidebarProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [active, setActive] = useState(activeId);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setActive(activeId);
  }, [activeId]);

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

  const itemClass = (id: string) =>
    `flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors md:w-full ${
      active === id
        ? "bg-indigo-50 font-medium text-indigo-700"
        : "text-gray-700 hover:bg-gray-50"
    }`;

  return (
    <aside className="w-full shrink-0 border-b border-gray-200 bg-white md:w-56 md:border-b-0 md:border-r">
      <div className="p-3 md:p-4">
        <h2 className="mb-2 hidden text-xs font-semibold uppercase tracking-wider text-gray-400 md:mb-3 md:block">
          商品分类
        </h2>
        {/* Mobile: horizontal scroll chips; Desktop: vertical list */}
        <ul className="flex gap-1 overflow-x-auto pb-1 md:flex-col md:space-y-1 md:overflow-visible md:pb-0">
          <li className="shrink-0 md:w-full">
            <button
              type="button"
              onClick={() => handleClick("all")}
              className={itemClass("all")}
            >
              <span className="text-base">📦</span>
              全部
            </button>
          </li>

          {loading && (
            <li className="px-3 py-2 text-xs text-gray-400">加载中...</li>
          )}

          {!loading && categories.length === 0 && (
            <li className="px-3 py-2 text-xs text-gray-400">暂无分类</li>
          )}

          {categories.map((cat) => (
            <li key={cat.id} className="shrink-0 md:w-full">
              <button
                type="button"
                onClick={() => handleClick(cat.id)}
                className={itemClass(cat.id)}
              >
                <span className="text-base">
                  {ICONS[cat.name] || ICONS.default}
                </span>
                <span className="truncate">{cat.name}</span>
                {typeof cat.productCount === "number" && (
                  <span className="hidden text-xs text-gray-400 md:inline">
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
