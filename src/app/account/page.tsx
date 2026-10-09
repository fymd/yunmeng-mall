"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  username: string;
  email: string | null;
  role: string;
}

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : { user: null }))
      .then((data) => {
        if (!data.user) {
          router.replace("/login");
          return;
        }
        setUser(data.user);
        setChecking(false);
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("两次输入的新密码不一致");
      return;
    }
    if (newPassword.length < 6) {
      setError("新密码至少 6 个字符");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "修改失败");
        return;
      }
      setSuccess(data.message || "密码已修改");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setError("网络错误，请重试");
    } finally {
      setSaving(false);
    }
  };

  if (checking) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-gray-400">
        加载中...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">账号设置</h1>
        <Link href="/" className="text-sm text-indigo-600 hover:underline">
          返回商城
        </Link>
      </div>

      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
        <p className="text-sm text-gray-600">
          当前用户：
          <span className="font-medium text-gray-900">{user?.username}</span>
          {user?.role === "ADMIN" && (
            <span className="ml-2 rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700">
              管理员
            </span>
          )}
        </p>
        {user?.email && (
          <p className="mt-1 text-xs text-gray-400">{user.email}</p>
        )}

        <h2 className="mt-6 text-sm font-semibold text-gray-900">修改密码</h2>
        <p className="mt-1 text-xs text-gray-500">
          生产环境请尽快修改默认管理员密码（admin123）
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
              {success}
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs text-gray-600">当前密码</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-600">新密码</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              required
              minLength={6}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-600">确认新密码</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
              minLength={6}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? "保存中..." : "修改密码"}
          </button>
        </form>
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-sm">
        <Link href="/orders" className="text-indigo-600 hover:underline">
          我的订单
        </Link>
        {user?.role === "ADMIN" && (
          <Link href="/admin" className="text-indigo-600 hover:underline">
            管理后台
          </Link>
        )}
      </div>
    </div>
  );
}
