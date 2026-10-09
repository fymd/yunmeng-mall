"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "\u767b\u5f55\u5931\u8d25");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("\u7f51\u7edc\u9519\u8bef\uff0c\u8bf7\u91cd\u8bd5");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-4 py-12">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-center text-xl font-semibold text-gray-900">\u767b\u5f55</h1>
        <p className="mt-1 text-center text-sm text-gray-500">
          \u767b\u5f55\u540e\u53ef\u4e0b\u5355\u5e76\u67e5\u8be2\u8ba2\u5355
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
          )}
          <div>
            <label className="mb-1 block text-sm text-gray-600">\u7528\u6237\u540d / \u90ae\u7bb1</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              required
              autoComplete="username"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-600">\u5bc6\u7801</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              required
              autoComplete="current-password"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "\u767b\u5f55\u4e2d..." : "\u767b\u5f55"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          \u8fd8\u6ca1\u6709\u8d26\u53f7\uff1f{" "}
          <Link href="/register" className="text-indigo-600 hover:underline">
            \u7acb\u5373\u6ce8\u518c
          </Link>
        </p>
        <p className="mt-2 text-center text-xs text-gray-400">
          \u6f14\u793a\u8d26\u53f7\uff1ademo / user123 \u6216 admin / admin123
        </p>
      </div>
    </div>
  );
}
