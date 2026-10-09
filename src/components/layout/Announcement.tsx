"use client";

import { useEffect, useState } from "react";

interface AnnouncementData {
  title: string;
  content: string;
  popup: boolean;
}

function storageKey(data: AnnouncementData) {
  // When admin changes title/content, popup shows again
  const hash = btoa(
    unescape(encodeURIComponent(data.title + "|" + data.content))
  ).slice(0, 24);
  return "ym_announcement_dismissed_" + hash;
}

export default function Announcement() {
  const [data, setData] = useState<AnnouncementData | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => (r.ok ? r.json() : {}))
      .then((cfg) => {
        const title = String(cfg.announcement_title || "").trim();
        const content = String(cfg.announcement_content || "").trim();
        if (!content && !title) return;

        const next: AnnouncementData = {
          title: title || "公告",
          content,
          popup: cfg.announcement_popup === "true",
        };
        setData(next);

        if (next.popup && typeof window !== "undefined") {
          try {
            const key = storageKey(next);
            if (!sessionStorage.getItem(key)) {
              setShowPopup(true);
            }
          } catch {
            setShowPopup(true);
          }
        }
      })
      .catch(() => {});
  }, []);

  const dismissPopup = () => {
    if (data) {
      try {
        sessionStorage.setItem(storageKey(data), "1");
      } catch {
        // ignore
      }
    }
    setShowPopup(false);
  };

  if (!data) return null;

  return (
    <>
      {/* Top banner */}
      {!bannerDismissed && data.content && (
        <div className="border-b border-amber-200 bg-amber-50">
          <div className="mx-auto flex max-w-7xl items-start gap-3 px-4 py-2.5 sm:items-center sm:px-6">
            <span className="mt-0.5 shrink-0 rounded bg-amber-200/80 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800 sm:mt-0">
              {data.title}
            </span>
            <p className="min-w-0 flex-1 text-sm text-amber-900/90 line-clamp-2 sm:line-clamp-1">
              {data.content}
            </p>
            <button
              type="button"
              onClick={() => setBannerDismissed(true)}
              className="shrink-0 text-amber-700/70 hover:text-amber-900"
              aria-label="关闭公告"
            >
              <svg
                className="h-4 w-4"
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
            </button>
          </div>
        </div>
      )}

      {/* Popup modal */}
      {showPopup && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={dismissPopup}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-semibold text-gray-900">
                {data.title}
              </h3>
              <button
                type="button"
                onClick={dismissPopup}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                aria-label="关闭"
              >
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
              </button>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-600">
              {data.content}
            </p>
            <button
              type="button"
              onClick={dismissPopup}
              className="mt-5 w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
            >
              我知道了
            </button>
          </div>
        </div>
      )}
    </>
  );
}
