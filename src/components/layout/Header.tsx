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

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : { user: null }))
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 text-sm font-bold text-white">
            \u4e91
          </div>
          <span className="text-lg font-semibold text-gray-900">
            \u4e91\u68a6<span className="text-indigo-600">AI</span>\u4ee3\u5145
          </span>
        </Link>

        <nav className="hidden items-center gap-1 sm:flex">
          <Link href="/" className="rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900">
            \u8d2d\u7269
          </Link>
          <Link href="/orders" className="rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900">
            \u8ba2\u5355\u67e5\u8be2
          </Link>
          <Link href="/help" className="rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900">
            \u5e2e\u52a9\u4e2d\u5fc3
          </Link>
          {user?.role === "ADMIN" && (
            <Link href="/admin" className="rounded-md px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50">
              \u7ba1\u7406\u540e\u53f0
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {loading ? (
            <span className="text-xs text-gray-400">...</span>
          ) : user ? (
            <>
              <span className="hidden text-sm text-gray-600 sm:inline">{user.username}</span>
              <button
                onClick={handleLogout}
                className="rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
              >
                \u9000\u51fa
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100">
                \u767b\u5f55
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
              >
                \u521b\u5efa\u8d26\u53f7
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
