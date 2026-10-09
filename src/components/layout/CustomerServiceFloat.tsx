"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale } from "@/lib/i18n";

const SESSION_KEY = "ym_chat_session";

type Msg = {
  id: string;
  role: string;
  content: string;
  contact?: string;
  createdAt: string;
};

export default function CustomerServiceFloat() {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"contact" | "chat">("chat");
  const [qq, setQq] = useState("");
  const [wechat, setWechat] = useState("");
  const [link, setLink] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [contact, setContact] = useState("");
  const [sending, setSending] = useState(false);
  const [hint, setHint] = useState("");
  const [live, setLive] = useState(false);
  const [unreadAdmin, setUnreadAdmin] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const lastIdRef = useRef<string>("");

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

  const mergeMessages = useCallback((incoming: Msg[]) => {
    setMessages((prev) => {
      const map = new Map(prev.map((m) => [m.id, m]));
      for (const m of incoming) map.set(m.id, m);
      return Array.from(map.values()).sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    });
  }, []);

  const loadHistory = useCallback(async () => {
    if (!sessionId) return;
    try {
      const res = await fetch(
        "/api/chat?sessionId=" + encodeURIComponent(sessionId)
      );
      const d = await res.json();
      const list = (d.messages || []) as Msg[];
      mergeMessages(list);
      if (list.length) lastIdRef.current = list[list.length - 1].id;
    } catch {
      /* */
    }
  }, [sessionId, mergeMessages]);

  // History when open chat
  useEffect(() => {
    if (!open || !sessionId || tab !== "chat") return;
    loadHistory();
  }, [open, sessionId, tab, loadHistory]);

  // SSE real-time
  useEffect(() => {
    if (!sessionId) return;
    let es: EventSource | null = null;
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let stopped = false;

    const startPoll = () => {
      if (pollTimer) return;
      pollTimer = setInterval(() => {
        if (open && tab === "chat") loadHistory();
      }, 4000);
    };

    try {
      es = new EventSource(
        "/api/chat/stream?sessionId=" + encodeURIComponent(sessionId)
      );
      es.onopen = () => {
        if (!stopped) setLive(true);
      };
      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === "message" && data.message) {
            const m = data.message as Msg;
            mergeMessages([m]);
            if (m.role === "admin" && !open) {
              setUnreadAdmin((n) => n + 1);
            }
          }
        } catch {
          /* */
        }
      };
      es.onerror = () => {
        setLive(false);
        es?.close();
        es = null;
        startPoll();
      };
    } catch {
      startPoll();
    }

    return () => {
      stopped = true;
      es?.close();
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [sessionId, open, tab, loadHistory, mergeMessages]);

  useEffect(() => {
    if (open) setUnreadAdmin(0);
  }, [open]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, open]);

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
      if (data.message) mergeMessages([data.message]);
      setHint("");
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
          <div className="flex items-center justify-between border-b border-gray-100 bg-indigo-600 px-3 py-2 text-white">
            <div>
              <p className="text-sm font-medium">在线客服</p>
              <p className="text-[10px] text-white/80">
                {live ? "● 实时连接" : "○ 轮询模式"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-white/90 hover:text-white"
            >
              ✕
            </button>
          </div>

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
              即时会话
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
            <div className="flex h-80 flex-col">
              <div
                ref={listRef}
                className="flex-1 space-y-2 overflow-y-auto bg-slate-50 p-3 text-sm"
              >
                {messages.length === 0 && (
                  <p className="text-center text-xs text-gray-400">
                    你好，有什么可以帮你？消息会实时推送给客服。
                  </p>
                )}
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3 py-1.5 ${
                        m.role === "user"
                          ? "rounded-br-md bg-indigo-600 text-white"
                          : "rounded-bl-md bg-white text-gray-800 shadow-sm"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{m.content}</p>
                      <p
                        className={`mt-0.5 text-[10px] ${
                          m.role === "user" ? "text-white/70" : "text-gray-400"
                        }`}
                      >
                        {new Date(m.createdAt).toLocaleTimeString("zh-CN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 bg-white p-2">
                <input
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="联系方式（选填，如微信/邮箱）"
                  className="mb-1 w-full rounded-lg border border-gray-200 px-2 py-1 text-xs"
                />
                <div className="flex gap-1">
                  <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
                    placeholder={t("chatPlaceholder")}
                    className="min-w-0 flex-1 rounded-lg border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-indigo-400"
                  />
                  <button
                    type="button"
                    onClick={send}
                    disabled={sending}
                    className="rounded-lg bg-indigo-600 px-3 text-xs font-medium text-white disabled:opacity-50"
                  >
                    {t("send")}
                  </button>
                </div>
                {hint && (
                  <p className="mt-1 text-[10px] text-red-500">{hint}</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700"
        aria-label="客服"
      >
        {open ? "✕" : "💬"}
        {!open && unreadAdmin > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold">
            {unreadAdmin > 9 ? "9+" : unreadAdmin}
          </span>
        )}
      </button>
    </div>
  );
}
