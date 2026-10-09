export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-3 text-sm text-gray-500 sm:flex-row">
          <p>© {new Date().getFullYear()} 云梦AI代充. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="/help" className="hover:text-gray-700">
              帮助中心
            </a>
            <a href="/orders" className="hover:text-gray-700">
              订单查询
            </a>
            <span className="text-gray-300">|</span>
            <span>客服请点击右下角</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
