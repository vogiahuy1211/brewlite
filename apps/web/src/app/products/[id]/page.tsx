'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Check, Plus, Minus } from 'lucide-react';
import { getProduct, getToppings } from '@/services/api';
import { Product, Topping, ItemSize } from '@/types/product';
import { useCartStore, SIZE_SURCHARGES } from '@/store/cart';

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [toppings, setToppings] = useState<Topping[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedSize, setSelectedSize] = useState<ItemSize>('M');
  const [selectedToppings, setSelectedToppings] = useState<Topping[]>([]);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    Promise.all([getProduct(id), getToppings()])
      .then(([prodData, topData]) => {
        setProduct(prodData);
        setToppings(topData);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Không thể tải chi tiết sản phẩm');
        setLoading(false);
      });
  }, [id]);

  const toggleTopping = (topping: Topping) => {
    if (selectedToppings.some((t) => t.id === topping.id)) {
      setSelectedToppings(selectedToppings.filter((t) => t.id !== topping.id));
    } else {
      setSelectedToppings([...selectedToppings, topping]);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
        <span className="text-5xl mb-2">😢</span>
        <h2 className="text-base font-bold text-gray-800">Không tìm thấy món</h2>
        <Link href="/" className="mt-4 px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-semibold">
          Về trang chủ
        </Link>
      </div>
    );
  }

  const basePrice = product.price;
  const sizePrice = SIZE_SURCHARGES[selectedSize];
  const toppingsPrice = selectedToppings.reduce((sum, t) => sum + t.price, 0);
  const unitPrice = basePrice + sizePrice + toppingsPrice;
  const totalPrice = unitPrice * qty;

  const handleAddToCart = () => {
    addItem(product, selectedSize, selectedToppings, qty);
    setAdded(true);
    setTimeout(() => {
      router.push('/cart');
    }, 400);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* Top Bar */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-3 max-w-lg mx-auto flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-sm font-bold text-gray-800 line-clamp-1">{product.name}</h2>
        <div className="w-9" />
      </div>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Ảnh sản phẩm */}
        <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-gray-100 shadow-sm">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">☕</div>
          )}
        </div>

        {/* Tên & Giá cơ sở */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <h1 className="text-lg font-bold text-gray-900">{product.name}</h1>
          <p className="text-xl font-extrabold text-amber-600 mt-1">
            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Còn lại trong kho: {product.stock} ly</p>
        </div>

        {/* Chọn Size */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 mb-3">1. Chọn Size (bắt buộc)</h3>
          <div className="grid grid-cols-3 gap-2">
            {(['S', 'M', 'L'] as ItemSize[]).map((size) => {
              const isSelected = selectedSize === size;
              const surcharge = SIZE_SURCHARGES[size];
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => setSelectedSize(size)}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    isSelected
                      ? 'border-amber-500 bg-amber-50 text-amber-800 shadow-sm'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <p className="font-bold text-sm">Size {size}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {surcharge > 0 ? `+${surcharge / 1000}k` : 'Chuẩn'}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Chọn Topping */}
        {toppings.length > 0 && (
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 mb-3">2. Thêm Topping (tùy chọn)</h3>
            <div className="space-y-2">
              {toppings.map((top) => {
                const isChecked = selectedToppings.some((t) => t.id === top.id);
                return (
                  <button
                    key={top.id}
                    type="button"
                    onClick={() => toggleTopping(top)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
                      isChecked
                        ? 'border-amber-500 bg-amber-50/60 text-amber-900'
                        : 'border-gray-100 text-gray-700 hover:border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                          isChecked ? 'bg-amber-500 border-amber-500 text-white' : 'border-gray-300 bg-white'
                        }`}
                      >
                        {isChecked && <Check size={14} />}
                      </div>
                      <span className="text-xs font-semibold">{top.name}</span>
                    </div>
                    <span className="text-xs font-bold text-amber-700">
                      +{new Intl.NumberFormat('vi-VN').format(top.price)}đ
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Chọn Số Lượng */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <span className="text-sm font-bold text-gray-900">Số lượng</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-700 active:bg-gray-100"
            >
              <Minus size={14} />
            </button>
            <span className="w-6 text-center font-bold text-sm text-gray-900">{qty}</span>
            <button
              onClick={() => setQty((q) => q + 1)}
              className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-700 active:bg-gray-100"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>
      </main>

      {/* Floating Bottom Add Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 z-30 shadow-md">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <div className="flex-1">
            <p className="text-[11px] text-gray-500">Tạm tính</p>
            <p className="text-lg font-black text-amber-600">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalPrice)}
            </p>
          </div>
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className="flex-1 py-3 px-4 bg-amber-500 hover:bg-amber-600 active:scale-95 disabled:bg-gray-300 text-white font-bold rounded-2xl text-sm transition-all shadow-md"
          >
            {added ? '✓ Đã thêm' : 'Thêm vào giỏ'}
          </button>
        </div>
      </div>
    </div>
  );
}
