'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Coffee,
  Zap,
  CreditCard,
  Sparkles,
  Store,
  Clock,
  ChevronRight,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react';

export default function Footer() {
  const pathname = usePathname();
  const shoppingPage =
    ['/', '/cart', '/checkout', '/orders'].includes(pathname) ||
    pathname.startsWith('/orders/') ||
    pathname.startsWith('/products/');
  if (!shoppingPage) return null;

  return (
    <footer
      aria-label="Chân trang BrewLite"
      className="mt-auto border-t border-orange-300/15 bg-[radial-gradient(ellipse_at_top,#3a2016,transparent_75%),linear-gradient(180deg,#251610_0%,#1a0f0b_100%)] text-orange-100/90 shadow-[0_-4px_24px_#140c071a]"
    >
      <div className="mx-auto max-w-5xl px-4 pt-12 pb-28 sm:px-6 sm:pb-12">
        {/* Bố cục 3 cột */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3 lg:gap-12">
          {/* Cột 1 — BrewLite */}
          <div className="space-y-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 rounded-xl group focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-300"
              aria-label="BrewLite — Trang chủ"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-orange-200/25 bg-[linear-gradient(145deg,#b65e28,#63321d)] text-orange-100 shadow-[0_4px_16px_#160c0733,inset_0_1px_0_#ffe0bc33] transition-transform group-hover:scale-105">
                <Coffee size={20} aria-hidden="true" />
              </div>
              <div>
                <span className="font-serif text-2xl font-bold tracking-tight text-orange-50">
                  Brew<span className="text-orange-300">Lite</span>
                </span>
                <p className="text-[10px] tracking-widest text-orange-200/60 uppercase font-medium">
                  Coffee & Tea Express
                </p>
              </div>
            </Link>

            <p className="text-xs leading-relaxed text-orange-100/75">
              Hệ thống đặt trước cà phê và trà tinh tế, nhận ngay tại quầy pha chế mà không cần xếp hàng. Tối ưu trải nghiệm gọi món hiện đại và tiện lợi.
            </p>

            {/* Badges tính năng thực tế */}
            <div className="flex flex-wrap gap-2 pt-1 text-[11px]">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-300/20 bg-orange-950/50 px-2.5 py-1 font-medium text-orange-200/90 shadow-sm backdrop-blur-xs">
                <Zap size={12} className="text-orange-400" aria-hidden="true" /> Đặt nhanh lấy liền
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-300/20 bg-orange-950/50 px-2.5 py-1 font-medium text-orange-200/90 shadow-sm backdrop-blur-xs">
                <CreditCard size={12} className="text-orange-400" aria-hidden="true" /> Ví điện tử & Thẻ
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-300/20 bg-orange-950/50 px-2.5 py-1 font-medium text-orange-200/90 shadow-sm backdrop-blur-xs">
                <Sparkles size={12} className="text-orange-400" aria-hidden="true" /> Tích điểm thành viên
              </span>
            </div>
          </div>

          {/* Cột 2 — Phục vụ tại quầy */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-300">
              <Store size={15} className="text-orange-400" aria-hidden="true" />
              <span>Phục vụ tại quầy</span>
            </h3>

            <p className="text-xs leading-relaxed text-orange-100/75">
              Thức uống được pha chế tươi mới theo thứ tự đặt. Quý khách vui lòng xuất trình mã đơn hàng (Order ID) tại quầy tiếp nhận để nhận đồ uống.
            </p>

            {/* Quy trình trạng thái đơn hàng */}
            <div className="rounded-xl border border-orange-200/15 bg-white/5 p-3 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-medium text-orange-200/80">
                <span className="flex items-center gap-1.5">
                  <Clock size={13} className="text-orange-400" aria-hidden="true" />
                  Quy trình phục vụ:
                </span>
                <span className="text-[10px] text-orange-300/90 font-semibold uppercase tracking-wider">
                  Trực quan
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                <div className="rounded-lg border border-orange-400/25 bg-orange-900/35 py-1.5 px-1 font-medium text-orange-200">
                  1. Đang pha
                </div>
                <div className="rounded-lg border border-orange-400/25 bg-orange-900/35 py-1.5 px-1 font-medium text-orange-200">
                  2. Mời lấy nước
                </div>
                <div className="rounded-lg border border-orange-400/25 bg-orange-900/35 py-1.5 px-1 font-medium text-orange-200">
                  3. Hoàn tất
                </div>
              </div>
            </div>

            {/* Điều hướng cột 2 */}
            <div className="flex flex-col gap-1.5 pt-1">
              <Link
                href="/"
                className="inline-flex min-h-8 items-center gap-1.5 text-xs text-orange-100/80 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-orange-300"
              >
                <ChevronRight size={13} className="text-orange-400" aria-hidden="true" />
                <span>Thực đơn gọi món</span>
              </Link>
              <Link
                href="/cart"
                className="inline-flex min-h-8 items-center gap-1.5 text-xs text-orange-100/80 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-orange-300"
              >
                <ChevronRight size={13} className="text-orange-400" aria-hidden="true" />
                <span>Giỏ hàng thanh toán</span>
              </Link>
            </div>
          </div>

          {/* Cột 3 — Hỗ trợ khách hàng */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-300">
              <HelpCircle size={15} className="text-orange-400" aria-hidden="true" />
              <span>Hỗ trợ khách hàng</span>
            </h3>

            {/* Hướng dẫn đặt hàng */}
            <div className="space-y-1.5 text-xs text-orange-100/75 leading-relaxed">
              <p className="font-medium text-orange-200/90">3 bước đặt đồ uống đơn giản:</p>
              <ol className="list-decimal list-inside space-y-1 pl-0.5 text-[11px] text-orange-100/70">
                <li>Chọn món, tùy chỉnh size và topping</li>
                <li>Xác nhận thanh toán qua ví điện tử hoặc thẻ</li>
                <li>Theo dõi trạng thái & nhận thức uống tại quầy</li>
              </ol>
            </div>

            {/* Điều hướng cột 3 */}
            <div className="flex flex-col gap-1.5 pt-0.5">
              <Link
                href="/orders"
                className="inline-flex min-h-8 items-center gap-1.5 text-xs text-orange-100/80 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-orange-300"
              >
                <ChevronRight size={13} className="text-orange-400" aria-hidden="true" />
                <span>Tra cứu & lịch sử đơn hàng</span>
              </Link>
              <Link
                href="/login"
                className="inline-flex min-h-8 items-center gap-1.5 text-xs text-orange-100/80 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-orange-300"
              >
                <ChevronRight size={13} className="text-orange-400" aria-hidden="true" />
                <span>Tài khoản thành viên</span>
              </Link>
            </div>

            {/* Lưu ý thanh toán mô phỏng */}
            <div className="rounded-xl border border-orange-300/20 bg-orange-950/40 p-3 text-xs leading-relaxed text-orange-100/75">
              <div className="flex items-start gap-2">
                <ShieldCheck size={16} className="text-orange-400 shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-[11px] leading-relaxed">
                  <span className="font-semibold text-orange-200 block mb-0.5">Lưu ý thanh toán</span>
                  Hệ thống vận hành thanh toán mô phỏng, không phát sinh giao dịch tiền thật.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Thanh cuối (Bottom Bar) */}
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-orange-300/15 pt-6 text-xs text-orange-200/60 sm:flex-row">
          <p>© 2026 BrewLite · Đồ án Công nghệ Phần mềm.</p>
          <p className="font-serif tracking-widest text-[11px] uppercase text-orange-200/80">
            Coffee & Tea.
          </p>
        </div>
      </div>
    </footer>
  );
}
