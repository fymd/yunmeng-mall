"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  username: string;
  role: string;
}

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [siteName, setSiteName] = useState("云梦AI代充");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : { user: null }))
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));

    fetch("/api/config")
      .then((r) => (r.ok ? r.json() : {}))
      .then((data) => {
        if (data.site_name) setSiteName(data.site_name);
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/");
    router.refresh();
  };

  // Split name for accent styling: prefer "AI" highlight if present
  const nameParts = (() => {
    const idx = siteName.indexOf("AI");
    if (idx >= 0) {
      return {
        before: siteName.slice(0, idx),
        mid: "AI",
        after: siteName.slice(idx + 2),
      };
    }
    return { before: siteName, mid: "", after: "" };
  })();

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 text-sm font-bold text-white">
            云
          </div>
          <span className="text-lg font-semibold text-gray-900">
            {nameParts.before}
            {nameParts.mid && (
              <span className="text-indigo-600">{nameParts.mid}</span>
            )}
            {nameParts.after}
          </span>
        </Link>

        <nav className="hidden items-center gap-1 sm:flex">
          <Link
            href="/"
            className="rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          >
            购物
          </Link>
          <Link
            href="/orders"
            className="rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          >
            订单查询
          </Link>
          <Link
            href="/help"
            className="rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          >
            帮助中心
          </Link>
          {user?.role === "ADMIN" && (
            <Link
              href="/admin"
              className="rounded-md px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50"
            >
              管理后台
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {loading ? (
            <span className="text-xs text-gray-400">...</span>
          ) : user ? (
            <>
              <span className="hidden text-sm text-gray-600 sm:inline">
                {user.username}
              </span>
              <button
                onClick={handleLogout}
                className="rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
              >
                退出
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
              >
                登录
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
              >
                创建账号
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
