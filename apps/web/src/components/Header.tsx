'use client';

import Link from 'next/link';
import { ShoppingCart, User, Coffee } from 'lucide-react';
import { useCartStore } from '@/store/cart';
import { useHydrated } from '@/hooks/useHydrated';

export default function Header() {
  const totalItems = useCartStore((state) => state.getTotalItems());
  const mounted = useHydrated();

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-gray-100 shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
            <Coffee size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">BrewLite</h1>
            <p className="text-[10px] text-gray-500 font-medium">Coffee & Tea Express</p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/orders"
            aria-label="Lịch sử đơn"
            className="p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <User size={20} />
          </Link>

          <Link
            href="/cart"
            aria-label="Xem giỏ hàng"
            className="relative p-2 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
          >
            <ShoppingCart size={20} />
            {mounted && totalItems > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-[11px] font-bold flex items-center justify-center shadow-sm">
                {totalItems > 99 ? '99+' : totalItems}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
