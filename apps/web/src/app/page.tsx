'use client';

import { useEffect, useState } from 'react';
import { getProducts } from '@/services/api';
import { Product } from '@/types/product';
import ProductCard from '@/components/ProductCard';
import { ProductSkeletonGrid } from '@/components/ProductSkeleton';
import Header from '@/components/Header';
import Link from 'next/link';
import { useCartStore } from '@/store/cart';

export default function MenuPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const totalItems = useCartStore((state) => state.getTotalItems());
  const totalPrice = useCartStore((state) => state.getTotalPrice());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    getProducts()
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Không thể kết nối đến máy chủ');
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <Header />

      <main className="max-w-lg mx-auto px-4 py-4">
        {/* Banner giới thiệu */}
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-2xl p-4 shadow-sm mb-4">
          <p className="text-xs font-medium uppercase tracking-wider text-amber-200">Đặt trước lấy ngay</p>
          <h2 className="text-lg font-bold mt-1">Cà phê ngon, không xếp hàng ⚡</h2>
          <p className="text-xs text-amber-100 mt-1">Nhập mã <span className="font-bold underline">WELCOME10</span> giảm ngay 10.000đ</p>
        </div>

        {/* Loading state */}
        {loading && <ProductSkeletonGrid />}

        {/* Error state */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <span className="text-5xl">😵</span>
            <p className="font-semibold text-gray-800">Không thể tải menu</p>
            <p className="text-xs text-gray-500">{error}</p>
            <button
              onClick={() => {
                setLoading(true);
                setError(null);
                getProducts()
                  .then((data) => {
                    setProducts(data);
                    setLoading(false);
                  })
                  .catch((err) => {
                    setError(err.message);
                    setLoading(false);
                  });
              }}
              className="mt-2 px-4 py-2 bg-amber-500 text-white rounded-full text-xs font-semibold hover:bg-amber-600"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && products.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-2 text-center">
            <span className="text-5xl">🫙</span>
            <p className="font-semibold text-gray-800">Chưa có sản phẩm nào</p>
          </div>
        )}

        {/* Grid menu */}
        {!loading && !error && products.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-800 text-sm">Danh sách đồ uống</h3>
              <span className="text-xs text-gray-500">{products.length} món</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Floating Cart Button */}
      {mounted && totalItems > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-30">
          <Link
            href="/cart"
            className="flex items-center justify-between max-w-lg mx-auto bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white p-3.5 rounded-2xl shadow-lg transition-all"
          >
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
                {totalItems}
              </span>
              <span className="text-sm font-semibold">Xem giỏ hàng</span>
            </div>
            <span className="text-sm font-bold">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalPrice)}
            </span>
          </Link>
        </div>
      )}
    </div>
  );
}
