"use client";

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
  PLENTY: { text: "\u975e\u5e38\u591a", color: "text-green-600 bg-green-50" },
  SUFFICIENT: { text: "\u5145\u8db3", color: "text-emerald-600 bg-emerald-50" },
  LOW: { text: "\u5373\u5c06\u552e\u7f44", color: "text-orange-600 bg-orange-50" },
  PREORDER: { text: "\u53ef\u9884\u8ba2", color: "text-blue-600 bg-blue-50" },
  SOLD_OUT: { text: "\u552e\u7f44", color: "text-gray-500 bg-gray-100" },
};

interface Props {
  product: Product | null;
  open: boolean;
  onClose: () => void;
  onBuy?: (product: Product) => void;
}

export default function ProductDetailModal({
  product,
  open,
  onClose,
  onBuy,
}: Props) {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <p className="text-xs text-gray-400">
              {product.category?.name || "\u5546\u54c1"}
            </p>
            <h2 className="mt-0.5 text-lg font-semibold text-gray-900">
              \u5546\u54c1\u8be6\u60c5
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="\u5173\u95ed"
          >
            \u2715
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
              \u00a5{Number(product.price).toFixed(2)}
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs ${stock.color}`}
            >
              {stock.text}
            </span>
          </div>

          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-xs font-medium text-gray-500">\u5546\u54c1\u8bf4\u660e</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">
              {product.description || "\u6682\u65e0\u8be6\u7ec6\u8bf4\u660e"}
            </p>
          </div>
        </div>

        <div className="flex gap-3 border-t border-gray-100 px-5 py-4">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            \u5173\u95ed
          </button>
          <button
            disabled={soldOut}
            onClick={() => onBuy?.(product)}
            className="flex-1 rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {soldOut ? "\u5df2\u552e\u7f44" : isPreorder ? "\u7acb\u5373\u9884\u8ba2" : "\u7acb\u5373\u8d2d\u4e70"}
          </button>
        </div>
      </div>
    </div>
  );
}
