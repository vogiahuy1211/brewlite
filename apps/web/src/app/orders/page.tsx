'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Clock, ShoppingBag, LogOut } from 'lucide-react';
import { getMyOrders } from '@/services/api';

export default function OrderHistoryPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('brewlite_token');
    const savedUser = localStorage.getItem('brewlite_user');

    if (!token) {
      router.push('/login');
      return;
    }

    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    getMyOrders()
      .then((data) => {
        setOrders(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('brewlite_token');
    localStorage.removeItem('brewlite_user');
    router.push('/login');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <span className="bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold">Đã thanh toán (PAID)</span>;
      case 'PREPARING':
        return <span className="bg-amber-100 text-amber-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold">Đang pha chế</span>;
      case 'READY':
        return <span className="bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold">Mời lấy nước</span>;
      case 'COMPLETED':
        return <span className="bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold">Hoàn tất</span>;
      case 'PAYMENT_FAILED':
        return <span className="bg-red-100 text-red-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold">Thất bại</span>;
      default:
        return <span className="bg-yellow-100 text-yellow-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold">Chờ xử lý</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-3 max-w-lg mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="p-2 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h2 className="text-base font-bold text-gray-800">Tài khoản & Lịch sử đơn</h2>
        </div>
        <button
          onClick={handleLogout}
          aria-label="Đăng xuất"
          className="p-2 rounded-xl text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogOut size={18} />
        </button>
      </div>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Profile Card */}
        {user && (
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-3xl p-5 shadow-sm">
            <p className="text-xs text-amber-100">Xin chào,</p>
            <h3 className="text-base font-extrabold mt-0.5">{user.email}</h3>
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/20 text-xs font-bold">
              <span>🌟 Điểm tích lũy (Loyalty):</span>
              <span className="text-amber-200 text-sm font-black">{user.loyalty_points || 0} pts</span>
            </div>
          </div>
        )}

        {/* Lịch sử đơn */}
        <div>
          <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-1.5">
            <ShoppingBag size={16} className="text-amber-500" />
            Đơn hàng gần đây ({orders.length})
          </h3>

          {loading ? (
            <div className="py-12 flex justify-center">
              <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-gray-100 text-center space-y-2">
              <span className="text-4xl">📄</span>
              <p className="text-xs font-bold text-gray-700">Chưa có đơn hàng nào</p>
              <Link href="/" className="text-xs text-amber-600 font-bold hover:underline inline-block mt-1">
                Đặt ly cà phê đầu tiên
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((ord) => (
                <div key={ord.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-mono font-bold text-gray-800">#{ord.id.slice(0, 8).toUpperCase()}</p>
                      <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                        <Clock size={11} />
                        {new Date(ord.createdAt).toLocaleString('vi-VN')}
                      </p>
                    </div>
                    {getStatusBadge(ord.status)}
                  </div>

                  <div className="border-t border-gray-50 pt-2 space-y-1">
                    {ord.items.map((item: any) => (
                      <div key={item.id} className="flex justify-between text-xs text-gray-600">
                        <span>
                          {item.productName} (Size {item.size}) × {item.qty}
                        </span>
                        <span className="font-semibold text-gray-800">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.lineTotal)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-gray-100 pt-2 flex justify-between items-center text-xs font-bold">
                    <span className="text-gray-500">Tổng thanh toán:</span>
                    <span className="text-amber-600 font-black text-sm">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(ord.finalAmount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
