"use client";

import { useCallback, useEffect, useState } from "react";

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

  const load = useCallback(async () => {
    setLoading(true);
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

  const sessions = Array.from(new Set(list.map((m) => m.sessionId)));
  const thread = active
    ? list
        .filter((m) => m.sessionId === active)
        .sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
    : [];

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
      setReply("");
      await load();
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">客服留言</h1>
          <p className="mt-1 text-sm text-gray-500">
            未读 {unread} · 前台悬浮窗提交的会话
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
            <p className="p-4 text-sm text-gray-400">暂无留言</p>
          )}
          <ul className="max-h-96 overflow-y-auto">
            {sessions.map((sid) => {
              const last = list.find((m) => m.sessionId === sid);
              const hasUnread = list.some(
                (m) => m.sessionId === sid && m.role === "user" && !m.read
              );
              return (
                <li key={sid}>
                  <button
                    type="button"
                    onClick={() => setActive(sid)}
                    className={`w-full border-b border-gray-50 px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                      active === sid ? "bg-indigo-50" : ""
                    }`}
                  >
                    <span className="font-mono text-[10px] text-gray-400">
                      {sid.slice(0, 10)}…
                      {hasUnread && (
                        <span className="ml-1 text-amber-600">●</span>
                      )}
                    </span>
                    <p className="truncate text-gray-700">
                      {last?.content || "—"}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex min-h-[20rem] flex-col rounded-xl border border-gray-200 bg-white md:col-span-2">
          {!active ? (
            <p className="m-auto text-sm text-gray-400">选择左侧会话</p>
          ) : (
            <>
              <div className="flex-1 space-y-2 overflow-y-auto p-4">
                {thread.map((m) => (
                  <div
                    key={m.id}
                    className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                      m.role === "admin"
                        ? "ml-auto bg-indigo-600 text-white"
                        : "bg-gray-100 text-gray-800"
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
                ))}
              </div>
              <div className="flex gap-2 border-t border-gray-100 p-3">
                <input
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendReply()}
                  placeholder="回复用户…"
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
                />
                <button
                  type="button"
                  onClick={sendReply}
                  className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm text-white"
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
