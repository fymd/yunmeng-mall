"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLocale } from "@/lib/i18n";

interface User {
  id: string;
  username: string;
  role: string;
}

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { t, toggle } = useLocale();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [siteName, setSiteName] = useState("云梦AI代充");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

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

  const navLink = (href: string, label: string, extra = "") => (
    <Link
      href={href}
      className={`rounded-md px-3 py-2 text-sm transition-colors ${
        pathname === href
          ? "bg-gray-100 font-medium text-gray-900"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      } ${extra}`}
    >
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-2 px-4 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 text-sm font-bold text-white">
            云
          </div>
          <span className="truncate text-base font-semibold text-gray-900 sm:text-lg">
            {nameParts.before}
            {nameParts.mid && (
              <span className="text-indigo-600">{nameParts.mid}</span>
            )}
            {nameParts.after}
          </span>
        </Link>

        <nav className="hidden items-center gap-1 sm:flex">
          {navLink("/", t("shop"))}
          {navLink("/orders", t("orders"))}
          {navLink("/help", t("help"))}
          {user?.role === "ADMIN" && (
            <Link
              href="/admin"
              className="rounded-md px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50"
            >
              {t("admin")}
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={toggle}
            className="rounded-md px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100"
            title="Language"
          >
            {t("lang")}
          </button>
          {loading ? (
            <span className="text-xs text-gray-400">...</span>
          ) : user ? (
            <>
              <Link
                href="/account"
                className="hidden max-w-[8rem] truncate text-sm text-gray-600 hover:text-indigo-600 sm:inline"
                title={t("account")}
              >
                {user.username}
              </Link>
              <button
                onClick={handleLogout}
                className="rounded-md px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-100 sm:px-3"
              >
                {t("logout")}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-md px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-100 sm:px-3"
              >
                {t("login")}
              </Link>
              <Link
                href="/register"
                className="hidden rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 sm:inline-block"
              >
                {t("register")}
              </Link>
            </>
          )}

          <button
            type="button"
            className="rounded-md p-2 text-gray-600 hover:bg-gray-100 sm:hidden"
            aria-label="菜单"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-gray-100 bg-white px-4 py-3 sm:hidden">
          <nav className="flex flex-col gap-1">
            {navLink("/", t("shop"), "block")}
            {navLink("/orders", t("orders"), "block")}
            {navLink("/help", t("help"), "block")}
            {user && navLink("/account", t("account"), "block")}
            {!user && navLink("/register", t("register"), "block")}
            {user?.role === "ADMIN" && (
              <Link
                href="/admin"
                className="rounded-md px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50"
              >
                {t("admin")}
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
