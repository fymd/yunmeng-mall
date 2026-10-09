import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl font-bold text-gray-200">404</p>
      <h1 className="mt-2 text-lg font-semibold text-gray-900">页面不存在</h1>
      <p className="mt-1 text-sm text-gray-500">
        您访问的页面可能已被移除或地址有误。
      </p>
      <Link
        href="/"
        className="mt-6 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
      >
        返回商城首页
      </Link>
    </div>
  );
}
