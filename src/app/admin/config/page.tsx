"use client";

import { useCallback, useEffect, useState } from "react";

const PAYMENT_MODES = [
  { value: "mock", label: "模拟支付（MVP）" },
  { value: "alipay", label: "支付宝" },
  { value: "wechat", label: "微信支付" },
];

type FormState = {
  site_name: string;
  site_logo: string;
  customer_service_qq: string;
  customer_service_wechat: string;
  customer_service_link: string;
  announcement_title: string;
  announcement_content: string;
  announcement_popup: string;
  payment_mode: string;
  force_login_to_order: string;
  order_timeout_minutes: string;
  alipay_app_id: string;
  alipay_private_key: string;
  alipay_public_key: string;
  alipay_notify_url: string;
  wechat_app_id: string;
  wechat_mch_id: string;
  wechat_api_key: string;
  wechat_notify_url: string;
  smtp_host: string;
  smtp_port: string;
  smtp_user: string;
  smtp_pass: string;
  smtp_from: string;
  notify_email: string;
};

const emptyForm: FormState = {
  site_name: "",
  site_logo: "",
  customer_service_qq: "",
  customer_service_wechat: "",
  customer_service_link: "",
  announcement_title: "",
  announcement_content: "",
  announcement_popup: "true",
  payment_mode: "mock",
  force_login_to_order: "true",
  order_timeout_minutes: "30",
  alipay_app_id: "",
  alipay_private_key: "",
  alipay_public_key: "",
  alipay_notify_url: "",
  wechat_app_id: "",
  wechat_mch_id: "",
  wechat_api_key: "",
  wechat_notify_url: "",
  smtp_host: "",
  smtp_port: "587",
  smtp_user: "",
  smtp_pass: "",
  smtp_from: "",
  notify_email: "",
};

const SENSITIVE = new Set([
  "alipay_private_key",
  "alipay_public_key",
  "wechat_api_key",
  "smtp_pass",
]);

function maskIfSet(key: string, value: string): string {
  if (SENSITIVE.has(key) && value) return "********";
  return value;
}

export default function AdminConfigPage() {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingMail, setTestingMail] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [dirtySensitive, setDirtySensitive] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/config?all=1");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "加载失败");
        return;
      }
      const c = data.config || {};
      const next: FormState = { ...emptyForm };
      for (const key of Object.keys(emptyForm) as (keyof FormState)[]) {
        const raw = c[key] ?? emptyForm[key];
        next[key] = maskIfSet(key, String(raw));
      }
      setForm(next);
      setDirtySensitive(new Set());
    } catch {
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setField = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (SENSITIVE.has(key)) {
      setDirtySensitive((prev) => new Set(prev).add(key));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const configs: Record<string, string> = {};
      for (const key of Object.keys(form) as (keyof FormState)[]) {
        const val = form[key];
        if (SENSITIVE.has(key)) {
          if (dirtySensitive.has(key) && val !== "********") {
            configs[key] = val;
          }
          continue;
        }
        configs[key] = val;
      }

      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ configs }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "保存失败");
        return;
      }
      setSuccess("配置已保存");
      await load();
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("网络错误");
    } finally {
      setSaving(false);
    }
  };

  const handleTestMail = async () => {
    setTestingMail(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/mail/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: form.notify_email.trim() || form.smtp_user.trim(),
          smtp_host: form.smtp_host,
          smtp_port: form.smtp_port,
          smtp_user: form.smtp_user,
          smtp_pass: form.smtp_pass,
          smtp_from: form.smtp_from,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || data.message || "测试邮件发送失败");
        return;
      }
      setSuccess(`测试邮件已发送至 ${data.to}，请检查收件箱（含垃圾箱）`);
      setTimeout(() => setSuccess(""), 8000);
    } catch {
      setError("网络错误，测试发送失败");
    } finally {
      setTestingMail(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-sm text-gray-400">加载配置中...</div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">站点配置</h1>
          <p className="mt-1 text-sm text-gray-500">
            网站基础、公告、下单规则、支付与邮件通知
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
        >
          重新加载
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
          <button className="ml-2 text-xs underline" onClick={() => setError("")}>
            关闭
          </button>
        </div>
      )}
      {success && (
        <div className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-8">
        <section className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-gray-900">网站基础</h2>
          <p className="mt-0.5 text-xs text-gray-500">顶部展示名称与客服入口</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-gray-600">网站名称</label>
              <input
                value={form.site_name}
                onChange={(e) => setField("site_name", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-indigo-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-gray-600">
                Logo URL（可选）
              </label>
              <input
                value={form.site_logo}
                onChange={(e) => setField("site_logo", e.target.value)}
                placeholder="https://..."
                className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-600">客服 QQ</label>
              <input
                value={form.customer_service_qq}
                onChange={(e) => setField("customer_service_qq", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-600">客服微信</label>
              <input
                value={form.customer_service_wechat}
                onChange={(e) =>
                  setField("customer_service_wechat", e.target.value)
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-indigo-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-gray-600">
                客服链接（QQ/微信/在线客服）
              </label>
              <input
                value={form.customer_service_link}
                onChange={(e) =>
                  setField("customer_service_link", e.target.value)
                }
                placeholder="https://... 或 tencent://..."
                className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-gray-900">公告</h2>
          <div className="mt-4 space-y-3">
            <div>
              <label className="mb-1 block text-xs text-gray-600">公告标题</label>
              <input
                value={form.announcement_title}
                onChange={(e) => setField("announcement_title", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-600">公告内容</label>
              <textarea
                value={form.announcement_content}
                onChange={(e) =>
                  setField("announcement_content", e.target.value)
                }
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-indigo-500"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.announcement_popup === "true"}
                onChange={(e) =>
                  setField(
                    "announcement_popup",
                    e.target.checked ? "true" : "false"
                  )
                }
                className="rounded border-gray-300"
              />
              弹窗显示公告
            </label>
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-gray-900">下单规则</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            强制登录与待支付超时（查询/下单时自动取消超时订单）
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="flex items-start gap-2 text-sm text-gray-700 sm:col-span-2">
              <input
                type="checkbox"
                checked={form.force_login_to_order === "true"}
                onChange={(e) =>
                  setField(
                    "force_login_to_order",
                    e.target.checked ? "true" : "false"
                  )
                }
                className="mt-0.5 rounded border-gray-300"
              />
              <span>
                <span className="font-medium">强制登录后才能下单</span>
                <span className="mt-0.5 block text-xs text-gray-500">
                  关闭后允许游客下单（无账号，仅凭订单号查询）
                </span>
              </span>
            </label>
            <div>
              <label className="mb-1 block text-xs text-gray-600">
                待支付超时（分钟）
              </label>
              <input
                type="number"
                min={0}
                value={form.order_timeout_minutes}
                onChange={(e) =>
                  setField("order_timeout_minutes", e.target.value)
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-gray-900">邮件通知（SMTP）</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            配置后，卡密自动发货等事件会尝试发信。可用「发送测试邮件」验证当前表单中的
            SMTP（无需先保存；密码为 ******** 时使用已保存密码）。
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-gray-600">SMTP Host</label>
              <input
                value={form.smtp_host}
                onChange={(e) => setField("smtp_host", e.target.value)}
                placeholder="smtp.example.com"
                className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-600">端口</label>
              <input
                value={form.smtp_port}
                onChange={(e) => setField("smtp_port", e.target.value)}
                placeholder="587"
                className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-indigo-500"
              />
              <p className="mt-1 text-xs text-gray-400">常用 587 或 465</p>
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-600">用户名</label>
              <input
                value={form.smtp_user}
                onChange={(e) => setField("smtp_user", e.target.value)}
                autoComplete="off"
                className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-600">
                密码（已保存显示 ********）
              </label>
              <input
                type="password"
                value={form.smtp_pass}
                onChange={(e) => setField("smtp_pass", e.target.value)}
                onFocus={() => {
                  if (form.smtp_pass === "********") {
                    setField("smtp_pass", "");
                  }
                }}
                autoComplete="new-password"
                placeholder="留空或 ******** 表示不修改"
                className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-600">发件人 From</label>
              <input
                value={form.smtp_from}
                onChange={(e) => setField("smtp_from", e.target.value)}
                placeholder="noreply@your-domain.com"
                className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-600">
                管理员通知 / 测试收件邮箱
              </label>
              <input
                type="email"
                value={form.notify_email}
                onChange={(e) => setField("notify_email", e.target.value)}
                placeholder="admin@example.com"
                className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-indigo-500"
              />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleTestMail}
              disabled={testingMail || !form.smtp_host.trim()}
              className="rounded-lg border border-indigo-300 bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
            >
              {testingMail ? "发送中…" : "发送测试邮件"}
            </button>
            <span className="text-xs text-gray-400">
              收件优先用「管理员通知邮箱」，否则用 SMTP 用户名
            </span>
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-gray-900">支付配置</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            MVP 使用模拟支付；填写真实密钥后可将模式切换为支付宝/微信
          </p>
          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-1 block text-xs text-gray-600">支付模式</label>
              <select
                value={form.payment_mode}
                onChange={(e) => setField("payment_mode", e.target.value)}
                className="w-full max-w-xs rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
              >
                {PAYMENT_MODES.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {(form.payment_mode === "alipay" || form.payment_mode === "mock") && (
              <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50/50 p-3">
                <p className="text-xs font-medium text-gray-600">支付宝参数</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs text-gray-500">App ID</label>
                    <input
                      value={form.alipay_app_id}
                      onChange={(e) => setField("alipay_app_id", e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs text-gray-500">
                      应用私钥（已保存显示为 ********）
                    </label>
                    <textarea
                      value={form.alipay_private_key}
                      onChange={(e) =>
                        setField("alipay_private_key", e.target.value)
                      }
                      onFocus={() => {
                        if (form.alipay_private_key === "********") {
                          setField("alipay_private_key", "");
                        }
                      }}
                      rows={2}
                      className="w-full rounded-lg border border-gray-300 px-3 py-1.5 font-mono text-xs outline-none focus:border-indigo-500"
                      placeholder="留空或 ******** 表示不修改"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs text-gray-500">支付宝公钥</label>
                    <textarea
                      value={form.alipay_public_key}
                      onChange={(e) =>
                        setField("alipay_public_key", e.target.value)
                      }
                      onFocus={() => {
                        if (form.alipay_public_key === "********") {
                          setField("alipay_public_key", "");
                        }
                      }}
                      rows={2}
                      className="w-full rounded-lg border border-gray-300 px-3 py-1.5 font-mono text-xs outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs text-gray-500">回调地址</label>
                    <input
                      value={form.alipay_notify_url}
                      onChange={(e) =>
                        setField("alipay_notify_url", e.target.value)
                      }
                      placeholder="https://your-domain/api/payment/alipay/notify"
                      className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {(form.payment_mode === "wechat" || form.payment_mode === "mock") && (
              <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50/50 p-3">
                <p className="text-xs font-medium text-gray-600">微信参数</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs text-gray-500">App ID</label>
                    <input
                      value={form.wechat_app_id}
                      onChange={(e) => setField("wechat_app_id", e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-gray-500">商户号</label>
                    <input
                      value={form.wechat_mch_id}
                      onChange={(e) => setField("wechat_mch_id", e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs text-gray-500">
                      API 密钥（已保存显示为 ********）
                    </label>
                    <input
                      type="password"
                      value={form.wechat_api_key}
                      onChange={(e) => setField("wechat_api_key", e.target.value)}
                      onFocus={() => {
                        if (form.wechat_api_key === "********") {
                          setField("wechat_api_key", "");
                        }
                      }}
                      className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-indigo-500"
                      placeholder="留空或 ******** 表示不修改"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs text-gray-500">回调地址</label>
                    <input
                      value={form.wechat_notify_url}
                      onChange={(e) =>
                        setField("wechat_notify_url", e.target.value)
                      }
                      placeholder="https://your-domain/api/payment/wechat/notify"
                      className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        <div className="flex gap-2 pb-8">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? "保存中..." : "保存全部配置"}
          </button>
        </div>
      </form>
    </div>
  );
}
