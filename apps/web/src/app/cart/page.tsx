'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Trash2, Plus, Minus, ArrowRight } from 'lucide-react';
import { useCartStore } from '@/store/cart';

export default function CartPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const items = useCartStore((state) => state.items);
  const updateQty = useCartStore((state) => state.updateQty);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const totalPrice = useCartStore((state) => state.getTotalPrice());
  const totalItems = useCartStore((state) => state.getTotalItems());

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-3 max-w-lg mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="p-2 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h2 className="text-base font-bold text-gray-800">Giỏ hàng của bạn ({totalItems})</h2>
        </div>
        {items.length > 0 && (
          <button
            onClick={() => {
              if (confirm('Bạn có chắc muốn xóa toàn bộ giỏ hàng?')) {
                clearCart();
              }
            }}
            className="text-xs text-red-500 font-semibold hover:underline"
          >
            Xóa hết
          </button>
        )}
      </div>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-3">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-6xl mb-3">🛒</span>
            <h3 className="text-base font-bold text-gray-800">Giỏ hàng đang trống</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-xs">
              Hãy chọn những ly cà phê thơm ngon từ menu của chúng tôi nhé!
            </p>
            <Link
              href="/"
              className="mt-5 px-6 py-2.5 bg-amber-500 text-white rounded-2xl text-xs font-bold shadow-md hover:bg-amber-600 transition-colors"
            >
              Xem thực đơn ngay
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-3"
                >
                  <div className="flex-1">
                    <h4 className="font-bold text-sm text-gray-900 leading-tight">{item.name}</h4>
                    <p className="text-xs font-semibold text-amber-700 mt-0.5">Size {item.size}</p>
                    {item.toppings.length > 0 && (
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Topping: {item.toppings.map((t) => t.name).join(', ')}
                      </p>
                    )}
                    <p className="text-sm font-extrabold text-gray-900 mt-2">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                        item.price * item.qty
                      )}
                    </p>
                  </div>

                  <div className="flex flex-col items-end justify-between h-full gap-3">
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors p-1"
                    >
                      <Trash2 size={16} />
                    </button>

                    <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-2 py-1">
                      <button
                        onClick={() => updateQty(item.id, -1)}
                        className="text-gray-600 hover:text-black active:scale-95"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="text-xs font-bold w-4 text-center">{item.qty}</span>
                      <button
                        onClick={() => updateQty(item.id, 1)}
                        className="text-gray-600 hover:text-black active:scale-95"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-2 mt-4 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Tạm tính ({totalItems} món)</span>
                <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalPrice)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Phí dịch vụ</span>
                <span className="text-green-600 font-semibold">Miễn phí</span>
              </div>
              <div className="border-t border-gray-100 pt-2 flex justify-between text-sm font-bold text-gray-900">
                <span>Tổng cộng</span>
                <span className="text-base text-amber-600">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalPrice)}
                </span>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Checkout CTA */}
      {items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 z-30 shadow-md">
          <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] text-gray-500">Tổng thanh toán</p>
              <p className="text-base font-black text-amber-600">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalPrice)}
              </p>
            </div>
            <button
              onClick={() => router.push('/checkout')}
              className="py-3 px-6 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold rounded-2xl text-sm transition-all shadow-md flex items-center gap-1.5"
            >
              Tiến hành đặt hàng
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
