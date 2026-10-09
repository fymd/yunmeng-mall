"use client";

import { useEffect, useState } from "react";

export default function CustomerServiceFloat() {
  const [open, setOpen] = useState(false);
  const [qq, setQq] = useState("");
  const [wechat, setWechat] = useState("");
  const [link, setLink] = useState("");

  useEffect(() => {
    fetch("/api/config")
      .then((r) => (r.ok ? r.json() : {}))
      .then((cfg) => {
        setQq(String(cfg.customer_service_qq || "").trim());
        setWechat(String(cfg.customer_service_wechat || "").trim());
        setLink(String(cfg.customer_service_link || "").trim());
      })
      .catch(() => {});
  }, []);

  const hasAny = qq || wechat || link;

  return (
    <div className="fixed bottom-5 right-5 z-40">
      {open && (
        <div className="mb-2 w-56 rounded-xl border border-gray-200 bg-white p-3 shadow-lg">
          <p className="text-xs font-semibold text-gray-500">联系客服</p>
          {!hasAny ? (
            <p className="mt-2 text-sm text-gray-400">暂未配置客服信息</p>
          ) : (
            <ul className="mt-2 space-y-2 text-sm">
              {qq && (
                <li className="text-gray-700">
                  <span className="text-gray-400">QQ：</span>
                  {qq}
                </li>
              )}
              {wechat && (
                <li className="text-gray-700">
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
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700"
        aria-label="客服"
      >
        {open ? (
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        ) : (
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.8}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
        )}
      </button>
    </div>
  );
}
