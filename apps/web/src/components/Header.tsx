'use client';

import Link from 'next/link';
import { ShoppingCart, Coffee } from 'lucide-react';
import { useCartStore } from '@/store/cart';
import { useHydrated } from '@/hooks/useHydrated';
import AccountMenu from '@/components/AccountMenu';

export default function Header() {
  const totalItems = useCartStore((state) => state.getTotalItems());
  const mounted = useHydrated();

  return (
    <header className="border-b border-orange-300/20 bg-[linear-gradient(110deg,#25150f,#482718_65%,#301b14)] text-orange-50 shadow-[0_4px_24px_#29160c14] sticky top-0 z-20">
      <div className="flex min-h-20 max-w-5xl mx-auto flex-wrap items-center justify-between gap-3 px-4 py-3 sm:flex-nowrap sm:px-6">
        <Link href="/" aria-label="BrewLite — về thực đơn" className="focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-300 flex shrink-0 items-center gap-2.5 rounded-xl group">
          <div className="border border-orange-200/25 bg-[linear-gradient(145deg,#b65e28,#63321d)] shadow-[0_4px_16px_#160c0733,inset_0_1px_0_#ffe0bc33] flex h-10 w-10 items-center justify-center rounded-2xl text-orange-100">
            <Coffee size={22} aria-hidden="true" />
          </div>
          <div>
            <span className="font-serif text-2xl font-bold tracking-tight leading-tight text-orange-50">Brew<span className="text-orange-300">Lite</span></span>
            <p className="text-[10px] tracking-widest text-orange-100/70">COFFEE & TEA</p>
          </div>
        </Link>

        <nav aria-label="Điều hướng chính" className="flex w-full items-center justify-between gap-2 sm:w-auto sm:gap-3">
          <div className="hidden sm:block">
            <Link href="/" className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-[14px] px-3 py-2.5 text-[13px] font-medium text-orange-100 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-300 motion-reduce:transition-none">Thực đơn</Link>
          </div>
          <AccountMenu />

          <Link
            href="/cart"
            aria-label="Xem giỏ hàng"
            className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-[14px] px-3 py-2.5 text-[13px] font-medium text-orange-100 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-300 motion-reduce:transition-none border border-orange-200/20 bg-white/5 relative"
          >
            <ShoppingCart size={20} aria-hidden="true" />
            <span className="hidden sm:inline">Giỏ hàng</span>
            {mounted && totalItems > 0 && (
              <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-orange-300 text-amber-950 rounded-full text-[11px] font-bold flex items-center justify-center shadow-sm">
                {totalItems > 99 ? '99+' : totalItems}
              </span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}
