import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SessionBoundary from "@/components/SessionBoundary";
import { Suspense } from "react";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BrewLite",
  description: "Đặt đồ uống tại BrewLite. Thanh toán mô phỏng, không thu tiền thật.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" style={{ fontFamily: "var(--font-geist-sans), Arial, sans-serif" }}>
        <Suspense fallback={<p role="status" className="p-8 text-center">Đang tải BrewLite…</p>}>
          <SessionBoundary>{children}<Footer /></SessionBoundary>
        </Suspense>
      </body>
    </html>
  );
}
