"use client";

import { useState } from "react";

const PLACEHOLDER_CATEGORIES = [
  { id: "all", name: "全部商品", icon: "📦" },
  { id: "gpt", name: "GPT", icon: "🤖" },
  { id: "claude", name: "Claude", icon: "✨" },
  { id: "twitter", name: "推特", icon: "𝕏" },
];

interface SidebarProps {
  activeId?: string;
  onSelect?: (id: string) => void;
}

export default function Sidebar({ activeId = "all", onSelect }: SidebarProps) {
  const [active, setActive] = useState(activeId);

  const handleClick = (id: string) => {
    setActive(id);
    onSelect?.(id);
  };

  return (
    <aside className="w-full shrink-0 border-r border-gray-200 bg-white md:w-56">
      <div className="p-4">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
          商品分类
        </h2>
        <ul className="space-y-1">
          {PLACEHOLDER_CATEGORIES.map((cat) => (
            <li key={cat.id}>
              <button
                onClick={() => handleClick(cat.id)}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  active === cat.id
                    ? "bg-indigo-50 font-medium text-indigo-700"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span className="text-base">{cat.icon}</span>
                {cat.name}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
