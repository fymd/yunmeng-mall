"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type Locale = "zh" | "en";

const dict = {
  zh: {
    shop: "购物",
    orders: "订单查询",
    help: "帮助中心",
    admin: "管理后台",
    login: "登录",
    register: "注册",
    logout: "退出",
    account: "账号设置",
    search: "搜索",
    buy: "购买",
    contactCs: "联系客服",
    send: "发送",
    lang: "EN",
    chatPlaceholder: "描述问题，可附订单号…",
    chatThanks: "已发送，客服会尽快回复",
  },
  en: {
    shop: "Shop",
    orders: "Orders",
    help: "Help",
    admin: "Admin",
    login: "Log in",
    register: "Sign up",
    logout: "Log out",
    account: "Account",
    search: "Search",
    buy: "Buy",
    contactCs: "Support",
    send: "Send",
    lang: "中文",
    chatPlaceholder: "Describe your issue / order no…",
    chatThanks: "Sent. Support will reply soon.",
  },
} as const;

type DictKey = keyof (typeof dict)["zh"];

const LocaleContext = createContext<{
  locale: Locale;
  t: (key: DictKey) => string;
  toggle: () => void;
}>({
  locale: "zh",
  t: (k) => dict.zh[k],
  toggle: () => {},
});

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>("zh");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("ym_locale") as Locale | null;
      if (saved === "en" || saved === "zh") setLocale(saved);
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = useCallback(() => {
    setLocale((prev) => {
      const next = prev === "zh" ? "en" : "zh";
      try {
        localStorage.setItem("ym_locale", next);
      } catch {
        /* ignore */
      }
      if (typeof document !== "undefined") {
        document.documentElement.lang = next === "zh" ? "zh-CN" : "en";
      }
      return next;
    });
  }, []);

  const t = useCallback(
    (key: DictKey) => dict[locale][key] ?? dict.zh[key] ?? key,
    [locale]
  );

  const value = useMemo(() => ({ locale, t, toggle }), [locale, t, toggle]);

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
