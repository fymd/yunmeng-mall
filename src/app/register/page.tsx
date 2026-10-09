"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
          email: email || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "\u6ce8\u518c\u5931\u8d25");
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
        <h1 className="text-center text-xl font-semibold text-gray-900">\u521b\u5efa\u8d26\u53f7</h1>
        <p className="mt-1 text-center text-sm text-gray-500">
          \u6ce8\u518c\u540e\u5373\u53ef\u8d2d\u4e70\u6570\u5b57\u5546\u54c1
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
          )}
          <div>
            <label className="mb-1 block text-sm text-gray-600">\u7528\u6237\u540d</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              required
              minLength={3}
              autoComplete="username"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-600">\u90ae\u7bb1\uff08\u53ef\u9009\uff09</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              autoComplete="email"
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
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "\u6ce8\u518c\u4e2d..." : "\u6ce8\u518c"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          \u5df2\u6709\u8d26\u53f7\uff1f{" "}
          <Link href="/login" className="text-indigo-600 hover:underline">
            \u53bb\u767b\u5f55
          </Link>
        </p>
      </div>
    </div>
  );
}
