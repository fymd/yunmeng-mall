"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/lib/i18n";

const SESSION_KEY = "ym_chat_session";

export default function CustomerServiceFloat() {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"contact" | "chat">("chat");
  const [qq, setQq] = useState("");
  const [wechat, setWechat] = useState("");
  const [link, setLink] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [messages, setMessages] = useState<
    { id: string; role: string; content: string; createdAt: string }[]
  >([]);
  const [text, setText] = useState("");
  const [contact, setContact] = useState("");
  const [sending, setSending] = useState(false);
  const [hint, setHint] = useState("");

  useEffect(() => {
    fetch("/api/config")
      .then((r) => (r.ok ? r.json() : {}))
      .then((cfg) => {
        setQq(String(cfg.customer_service_qq || "").trim());
        setWechat(String(cfg.customer_service_wechat || "").trim());
        setLink(String(cfg.customer_service_link || "").trim());
      })
      .catch(() => {});

    try {
      let sid = localStorage.getItem(SESSION_KEY) || "";
      if (!sid) {
        sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
        localStorage.setItem(SESSION_KEY, sid);
      }
      setSessionId(sid);
    } catch {
      setSessionId("anon");
    }
  }, []);

  useEffect(() => {
    if (!open || !sessionId || tab !== "chat") return;
    fetch("/api/chat?sessionId=" + encodeURIComponent(sessionId))
      .then((r) => r.json())
      .then((d) => setMessages(d.messages || []))
      .catch(() => {});
  }, [open, sessionId, tab]);

  const send = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    setHint("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: text.trim(),
          contact,
          sessionId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setHint(data.error || "发送失败");
        return;
      }
      if (data.sessionId) {
        setSessionId(data.sessionId);
        try {
          localStorage.setItem(SESSION_KEY, data.sessionId);
        } catch {
          /* */
        }
      }
      setText("");
      setHint(t("chatThanks"));
      setMessages((prev) => [...prev, data.message]);
    } catch {
      setHint("网络错误");
    } finally {
      setSending(false);
    }
  };

  const hasAny = qq || wechat || link;

  return (
    <div className="fixed bottom-5 right-5 z-40">
      {open && (
        <div className="mb-2 flex w-72 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl sm:w-80">
          <div className="flex border-b border-gray-100">
            <button
              type="button"
              onClick={() => setTab("chat")}
              className={`flex-1 py-2 text-xs font-medium ${
                tab === "chat"
                  ? "border-b-2 border-indigo-600 text-indigo-700"
                  : "text-gray-500"
              }`}
            >
              在线留言
            </button>
            <button
              type="button"
              onClick={() => setTab("contact")}
              className={`flex-1 py-2 text-xs font-medium ${
                tab === "contact"
                  ? "border-b-2 border-indigo-600 text-indigo-700"
                  : "text-gray-500"
              }`}
            >
              {t("contactCs")}
            </button>
          </div>

          {tab === "contact" ? (
            <div className="p-3">
              {!hasAny ? (
                <p className="text-sm text-gray-400">暂未配置 QQ/微信/链接</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {qq && (
                    <li>
                      <span className="text-gray-400">QQ：</span>
                      {qq}
                    </li>
                  )}
                  {wechat && (
                    <li>
                      <span className="text-gray-400">微信：</span>
                      {wechat}
                    </li>
                  )}
                  {link && (
                    <li>
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:underline"
                      >
                        打开客服链接 →
                      </a>
                    </li>
                  )}
                </ul>
              )}
            </div>
          ) : (
            <div className="flex h-72 flex-col">
              <div className="flex-1 space-y-2 overflow-y-auto p-3 text-sm">
                {messages.length === 0 && (
                  <p className="text-xs text-gray-400">
                    留下问题与联系方式，管理员可在后台回复。
                  </p>
                )}
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`rounded-lg px-2.5 py-1.5 ${
                      m.role === "admin"
                        ? "bg-indigo-50 text-indigo-900"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    <p className="text-[10px] text-gray-400">
                      {m.role === "admin" ? "客服" : "我"}
                    </p>
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 p-2">
                <input
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="联系方式（选填）"
                  className="mb-1 w-full rounded border border-gray-200 px-2 py-1 text-xs"
                />
                <div className="flex gap-1">
                  <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && send()}
                    placeholder={t("chatPlaceholder")}
                    className="min-w-0 flex-1 rounded border border-gray-200 px-2 py-1.5 text-sm"
                  />
                  <button
                    type="button"
                    onClick={send}
                    disabled={sending}
                    className="rounded bg-indigo-600 px-2.5 text-xs text-white disabled:opacity-50"
                  >
                    {t("send")}
                  </button>
                </div>
                {hint && (
                  <p className="mt-1 text-[10px] text-emerald-600">{hint}</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700"
        aria-label="客服"
      >
        {open ? "✕" : "💬"}
      </button>
    </div>
  );
}
