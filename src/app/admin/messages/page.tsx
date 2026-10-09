"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface Msg {
  id: string;
  sessionId: string;
  role: string;
  content: string;
  contact: string;
  read: boolean;
  createdAt: string;
}

export default function AdminMessagesPage() {
  const [list, setList] = useState<Msg[]>([]);
  const [unread, setUnread] = useState(0);
  const [active, setActive] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(false);
  const threadEndRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/chat?all=1");
      const data = await res.json();
      setList(data.messages || []);
      setUnread(data.unread || 0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // SSE for admin inbox
  useEffect(() => {
    let es: EventSource | null = null;
    let poll: ReturnType<typeof setInterval> | null = null;

    try {
      es = new EventSource("/api/chat/stream?admin=1");
      es.onopen = () => setLive(true);
      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === "message" && data.message) {
            const m = data.message as Msg;
            setList((prev) => {
              if (prev.some((x) => x.id === m.id)) return prev;
              return [m, ...prev];
            });
            if (m.role === "user" && !m.read) {
              setUnread((n) => n + 1);
            }
          }
          if (data.type === "read") {
            load();
          }
        } catch {
          /* */
        }
      };
      es.onerror = () => {
        setLive(false);
        es?.close();
        es = null;
        if (!poll) poll = setInterval(load, 5000);
      };
    } catch {
      poll = setInterval(load, 5000);
    }

    return () => {
      es?.close();
      if (poll) clearInterval(poll);
    };
  }, [load]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [list, active]);

  const sessions = Array.from(new Set(list.map((m) => m.sessionId)));
  const thread = active
    ? list
        .filter((m) => m.sessionId === active)
        .sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
    : [];

  const openSession = async (sid: string) => {
    setActive(sid);
    await fetch("/api/chat", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: sid }),
    });
    setList((prev) =>
      prev.map((m) =>
        m.sessionId === sid && m.role === "user" ? { ...m, read: true } : m
      )
    );
    setUnread((n) =>
      Math.max(
        0,
        n -
          list.filter(
            (m) => m.sessionId === sid && m.role === "user" && !m.read
          ).length
      )
    );
  };

  const sendReply = async () => {
    if (!active || !reply.trim()) return;
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: active,
        content: reply.trim(),
        asAdmin: true,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.message) {
        setList((prev) => [data.message, ...prev.filter((x) => x.id !== data.message.id)]);
      }
      setReply("");
    }
  };

  const markAll = async () => {
    await fetch("/api/chat", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true }),
    });
    load();
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">客服 IM</h1>
          <p className="mt-1 text-sm text-gray-500">
            未读 {unread}
            {" · "}
            <span className={live ? "text-emerald-600" : "text-gray-400"}>
              {live ? "实时推送已连接" : "轮询模式"}
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={markAll}
          className="text-sm text-indigo-600 hover:underline"
        >
          全部标为已读
        </button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white md:col-span-1">
          <p className="border-b border-gray-100 px-3 py-2 text-xs text-gray-500">
            会话列表
          </p>
          {loading && (
            <p className="p-4 text-sm text-gray-400">加载中...</p>
          )}
          {!loading && sessions.length === 0 && (
            <p className="p-4 text-sm text-gray-400">暂无会话</p>
          )}
          <ul className="max-h-[28rem] overflow-y-auto">
            {sessions.map((sid) => {
              const msgs = list.filter((m) => m.sessionId === sid);
              const last = msgs[0];
              const hasUnread = msgs.some(
                (m) => m.role === "user" && !m.read
              );
              const contact = msgs.find((m) => m.contact)?.contact;
              return (
                <li key={sid}>
                  <button
                    type="button"
                    onClick={() => openSession(sid)}
                    className={`w-full border-b border-gray-50 px-3 py-2.5 text-left text-sm hover:bg-gray-50 ${
                      active === sid ? "bg-indigo-50" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-mono text-[10px] text-gray-400">
                        {sid.slice(0, 12)}…
                      </span>
                      {hasUnread && (
                        <span className="h-2 w-2 rounded-full bg-amber-500" />
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-gray-800">
                      {last?.content || "—"}
                    </p>
                    {contact && (
                      <p className="truncate text-[10px] text-gray-400">
                        {contact}
                      </p>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex min-h-[24rem] flex-col rounded-xl border border-gray-200 bg-white md:col-span-2">
          {!active ? (
            <p className="m-auto text-sm text-gray-400">选择左侧会话开始回复</p>
          ) : (
            <>
              <div className="border-b border-gray-100 px-4 py-2 text-xs text-gray-500">
                会话 {active.slice(0, 16)}…
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto bg-slate-50 p-4">
                {thread.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.role === "admin" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                        m.role === "admin"
                          ? "rounded-br-md bg-indigo-600 text-white"
                          : "rounded-bl-md bg-white text-gray-800 shadow-sm"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{m.content}</p>
                      {m.contact && m.role === "user" && (
                        <p className="mt-1 text-[10px] opacity-70">
                          联系: {m.contact}
                        </p>
                      )}
                      <p className="mt-1 text-[10px] opacity-60">
                        {new Date(m.createdAt).toLocaleString("zh-CN")}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={threadEndRef} />
              </div>
              <div className="flex gap-2 border-t border-gray-100 p-3">
                <input
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendReply()}
                  placeholder="输入回复，Enter 发送…"
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={sendReply}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
                >
                  发送
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
