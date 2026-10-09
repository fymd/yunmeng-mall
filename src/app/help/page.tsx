"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function HelpPage() {
  const [qq, setQq] = useState("");
  const [wechat, setWechat] = useState("");
  const [link, setLink] = useState("");
  const [siteName, setSiteName] = useState("云梦AI代充");

  useEffect(() => {
    fetch("/api/config")
      .then((r) => (r.ok ? r.json() : {}))
      .then((cfg) => {
        if (cfg.site_name) setSiteName(cfg.site_name);
        setQq(String(cfg.customer_service_qq || "").trim());
        setWechat(String(cfg.customer_service_wechat || "").trim());
        setLink(String(cfg.customer_service_link || "").trim());
      })
      .catch(() => {});
  }, []);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="text-xl font-semibold text-gray-900">帮助中心</h1>
      <p className="mt-1 text-sm text-gray-500">{siteName} 使用说明</p>

      <div className="mt-6 space-y-4">
        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900">如何下单？</h2>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-gray-600">
            <li>注册并登录账号</li>
            <li>在首页选择商品，点击购买</li>
            <li>演示环境为模拟支付，下单后订单一般为「已支付」</li>
            <li>在「订单查询」查看进度，管理员发货后状态变为「已发货」</li>
          </ol>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900">订单状态说明</h2>
          <ul className="mt-2 space-y-1 text-sm text-gray-600">
            <li>待支付 → 已支付 → 已发货 → 已完成</li>
            <li>可取消或退款由管理员在后台操作</li>
          </ul>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900">联系客服</h2>
          <p className="mt-2 text-sm text-gray-600">
            也可点击页面右下角客服按钮。
          </p>
          <ul className="mt-2 space-y-1 text-sm text-gray-700">
            {qq && <li>QQ：{qq}</li>}
            {wechat && <li>微信：{wechat}</li>}
            {link && (
              <li>
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:underline"
                >
                  在线客服链接
                </a>
              </li>
            )}
            {!qq && !wechat && !link && (
              <li className="text-gray-400">暂未配置，请联系站点管理员</li>
            )}
          </ul>
        </section>
      </div>

      <div className="mt-8 flex gap-3 text-sm">
        <Link href="/" className="text-indigo-600 hover:underline">
          返回商城
        </Link>
        <Link href="/orders" className="text-indigo-600 hover:underline">
          订单查询
        </Link>
      </div>
    </div>
  );
}
