"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

interface User {
  id: string;
  username: string;
  role: string;
}

const NAV = [
  { href: "/admin", label: "\u6982\u89c8", exact: true },
  { href: "/admin/categories", label: "\u5206\u7c7b\u7ba1\u7406" },
  { href: "/admin/products", label: "\u5546\u54c1\u7ba1\u7406" },
  { href: "/admin/orders", label: "\u8ba2\u5355\u7ba1\u7406" },
  { href: "/admin/config", label: "\u7ad9\u70b9\u914d\u7f6e" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : { user: null }))
      .then((data) => {
        if (!data.user) {
          router.replace("/login");
          return;
        }
        if (data.user.role !== "ADMIN") {
          setDenied(true);
          setChecking(false);
          return;
        }
        setUser(data.user);
        setChecking(false);
      })
      .catch(() => {
        router.replace("/login");
      });
  }, [router]);

  if (checking) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-gray-400">
        \u9a8c\u8bc1\u6743\u9650\u4e2d...
      </div>
    );
  }

  if (denied) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-lg font-medium text-gray-900">\u65e0\u8bbf\u95ee\u6743\u9650</p>
        <p className="mt-2 text-sm text-gray-500">
          \u5f53\u524d\u8d26\u53f7\u4e0d\u662f\u7ba1\u7406\u5458\uff0c\u65e0\u6cd5\u8fdb\u5165\u540e\u53f0\u3002
        </p>
        <Link
          href="/"
          className="mt-4 inline-block text-sm text-indigo-600 hover:underline"
        >
          \u8fd4\u56de\u5546\u57ce
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-7xl flex-col md:flex-row">
      <aside className="w-full shrink-0 border-b border-gray-200 bg-white md:w-52 md:border-b-0 md:border-r">
        <div className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            \u7ba1\u7406\u540e\u53f0
          </p>
          <p className="mt-1 truncate text-sm text-gray-600">{user?.username}</p>
          <nav className="mt-4 space-y-1">
            {NAV.map((item) => {
              const active = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                    active
                      ? "bg-indigo-50 font-medium text-indigo-700"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <Link
            href="/"
            className="mt-6 block rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-50"
          >
            \u2190 \u8fd4\u56de\u5546\u57ce
          </Link>
        </div>
      </aside>

      <div className="flex-1 p-4 sm:p-6">{children}</div>
    </div>
  );
}
