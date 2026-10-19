import { getProducts } from "@/services/api";
import ProductCard from "@/components/ProductCard";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";

export default async function MenuPage() {
  let products = [];
  let error: string | null = null;

  try {
    products = await getProducts();
  } catch (e) {
    error = e instanceof Error ? e.message : "Đã xảy ra lỗi không xác định";
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-4 py-4 max-w-lg mx-auto">
          <div>
            <h1 className="text-xl font-bold text-gray-900">☕ BrewLite</h1>
            <p className="text-xs text-gray-500">Đặt đồ uống nhanh, không chờ đợi</p>
          </div>
          <button
            aria-label="Xem giỏ hàng"
            className="relative p-2 rounded-full bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors"
          >
            <ShoppingCart size={22} />
            {/* Badge — sẽ cập nhật với Zustand ở Sprint 2 */}
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4">
        {/* Error State */}
        {error && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <span className="text-5xl">😵</span>
            <div>
              <p className="font-semibold text-gray-800">Không thể tải menu</p>
              <p className="text-sm text-gray-500 mt-1">{error}</p>
            </div>
            <Link
              href="/"
              className="px-5 py-2 bg-amber-500 text-white rounded-full text-sm font-medium hover:bg-amber-600 transition-colors"
            >
              Thử lại
            </Link>
          </div>
        )}

        {/* Empty State */}
        {!error && products.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <span className="text-5xl">🫙</span>
            <div>
              <p className="font-semibold text-gray-800">Chưa có sản phẩm</p>
              <p className="text-sm text-gray-500 mt-1">
                Menu đang được cập nhật, vui lòng quay lại sau.
              </p>
            </div>
          </div>
        )}

        {/* Product Grid */}
        {!error && products.length > 0 && (
          <>
            <p className="text-sm text-gray-500 mb-3">
              {products.length} sản phẩm
            </p>
            <div className="grid grid-cols-2 gap-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}
      </main>

      {/* Bottom CTA Bar — sẽ hiển thị khi có sản phẩm trong giỏ (Sprint 2) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100">
        <div className="max-w-lg mx-auto">
          <button
            disabled
            className="w-full py-3 bg-amber-500 text-white font-semibold rounded-full text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Xem giỏ hàng
          </button>
        </div>
      </div>
    </div>
  );
}
