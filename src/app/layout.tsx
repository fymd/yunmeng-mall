import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Announcement from "@/components/layout/Announcement";
import CustomerServiceFloat from "@/components/layout/CustomerServiceFloat";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "云梦AI代充 - 数字商品商城",
  description: "ChatGPT / Claude / 推特 等 AI 数字商品代充平台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-gray-50 antialiased`}
      >
        <div className="flex min-h-screen flex-col">
          <Header />
          <Announcement />
          <main className="flex-1">{children}</main>
          <Footer />
          <CustomerServiceFloat />
        </div>
      </body>
    </html>
  );
}
