"use client";

import { useEffect, useState } from "react";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stockStatus: string;
  tags: string;
  imageUrl?: string | null;
  category?: { id: string; name: string };
}

const STOCK_LABEL: Record<string, { text: string; color: string }> = {
  PLENTY: { text: "非常多", color: "text-green-600 bg-green-50" },
  SUFFICIENT: { text: "充足", color: "text-emerald-600 bg-emerald-50" },
  LOW: { text: "即将售罄", color: "text-orange-600 bg-orange-50" },
  PREORDER: { text: "可预订", color: "text-blue-600 bg-blue-50" },
  SOLD_OUT: { text: "售罄", color: "text-gray-500 bg-gray-100" },
};

const MAX_REMARK = 500;

interface Props {
  product: Product | null;
  open: boolean;
  onClose: () => void;
  /** Called with product and user remark (e.g. account email) */
  onBuy?: (product: Product, remark: string) => void | Promise<void>;
  buying?: boolean;
}

export default function ProductDetailModal({
  product,
  open,
  onClose,
  onBuy,
  buying = false,
}: Props) {
  const [remark, setRemark] = useState("");

  useEffect(() => {
    if (open) setRemark("");
  }, [open, product?.id]);

  if (!open || !product) return null;

  const stock = STOCK_LABEL[product.stockStatus] || {
    text: product.stockStatus,
    color: "text-gray-600 bg-gray-50",
  };
  const tags = product.tags
    ? product.tags.split(",").map((t) => t.trim()).filter(Boolean)
    : [];
  const soldOut = product.stockStatus === "SOLD_OUT";
  const isPreorder = product.stockStatus === "PREORDER";

  const handleBuy = () => {
    if (soldOut || buying) return;
    onBuy?.(product, remark.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <p className="text-xs text-gray-400">
              {product.category?.name || "商品"}
            </p>
            <h2 className="mt-0.5 text-lg font-semibold text-gray-900">
              商品详情
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="关闭"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <h3 className="text-base font-medium text-gray-900">{product.name}</h3>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs text-indigo-600"
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-indigo-600">
              ¥{Number(product.price).toFixed(2)}
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs ${stock.color}`}
            >
              {stock.text}
            </span>
          </div>

          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-xs font-medium text-gray-500">商品说明</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">
              {product.description || "暂无详细说明"}
            </p>
          </div>

          {!soldOut && (
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                下单备注
                <span className="font-normal text-gray-400">
                  （选填，如充值账号邮箱）
                </span>
              </label>
              <textarea
                value={remark}
                onChange={(e) =>
                  setRemark(e.target.value.slice(0, MAX_REMARK))
                }
                rows={3}
                placeholder="例如：需要充值的邮箱 user@example.com"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
              <p className="mt-1 text-right text-[10px] text-gray-400">
                {remark.length}/{MAX_REMARK}
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3 border-t border-gray-100 px-5 py-4">
          <button
            onClick={onClose}
            disabled={buying}
            className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            关闭
          </button>
          <button
            disabled={soldOut || buying}
            onClick={handleBuy}
            className="flex-1 rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {soldOut
              ? "已售罄"
              : buying
                ? "提交中..."
                : isPreorder
                  ? "立即预订"
                  : "立即购买"}
          </button>
        </div>
      </div>
    </div>
  );
}
