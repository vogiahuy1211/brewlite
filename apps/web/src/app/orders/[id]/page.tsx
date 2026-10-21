'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Coffee, Clock, Home, ArrowRight } from 'lucide-react';
import axios from 'axios';
import { apiErrorMessage, getOrder } from '@/services/api';
import { captureSession, isSessionCurrent } from '@/services/session';
import { orderLabels, readOrder, type ConfirmedOrder } from '@/services/orderConfirmation';

export default function OrderConfirmPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [result, setResult] = useState<{ id: string; order?: ConfirmedOrder; error?: string } | null>(null);

  useEffect(() => {
    let active = true;
    const session = captureSession();
    getOrder(id)
      .then((data) => {
        if (active && isSessionCurrent(session)) setResult({ id, order: readOrder(data, id) });
      })
      .catch((error: unknown) => {
        if (!active || !isSessionCurrent(session)) return;
        const status = axios.isAxiosError(error) ? error.response?.status : undefined;
        setResult({ id, error: status === 403 ? 'Bạn không có quyền xem đơn hàng này.'
          : status === 404 ? 'Không tìm thấy đơn hàng hoặc bạn không có quyền truy cập.'
          : apiErrorMessage(error, 'Không tải được đơn hàng. Chưa thể xác nhận trạng thái thanh toán.') });
      });
    return () => { active = false; };
  }, [id]);

  if (!result || result.id !== id) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const order = result.order;
  if (!order) return (
    <div role="alert" className="min-h-screen bg-gray-50 p-8 text-center space-y-4">
      <h2 className="font-bold">Chưa xác minh được đơn hàng</h2>
      <p>{result.error}</p>
      <Link href="/orders" className="underline">Về lịch sử đơn hàng</Link>
    </div>
  );
  const paid = ['PAID', 'PREPARING', 'READY', 'COMPLETED'].includes(order.status);

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* Card Thành công */}
        <div className="bg-white rounded-3xl p-6 text-center border border-gray-100 shadow-sm space-y-3">
          <div className={`w-16 h-16 ${paid ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-700'} rounded-full flex items-center justify-center mx-auto shadow-inner`}>
            {paid ? <CheckCircle2 size={36} /> : <Clock size={36} />}
          </div>

          <h2 className="text-xl font-black text-gray-900">{orderLabels[order.status]}</h2>
          <p className="text-xs text-gray-500 max-w-xs mx-auto">
            Trạng thái được cung cấp bởi hệ thống. Thanh toán mô phỏng, không thu tiền thật.
          </p>

          <div className="bg-amber-50 rounded-2xl p-3.5 border border-amber-100 inline-block w-full">
            <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Mã đơn hàng</p>
            <p className="text-lg font-mono font-black text-amber-900 mt-0.5">#{id.slice(0, 8).toUpperCase()}</p>
            <div className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${paid ? 'bg-green-600' : 'bg-amber-700'} text-white text-[11px] font-bold shadow-sm`}>
              Trạng thái: {order.status}
            </div>
          </div>

        </div>

        {/* Danh sách món trong đơn */}
        {order?.items && (
          <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
              <Coffee size={15} className="text-amber-500" />
              Chi tiết món đã đặt
            </h3>
            <div className="divide-y divide-gray-100">
              {order.items.map((item) => (
                <div key={item.id} className="py-2.5 flex justify-between items-start text-xs">
                  <div>
                    <p className="font-bold text-gray-900">
                      {item.productName} <span className="text-amber-700 font-semibold">(x{item.qty})</span>
                    </p>
                    <p className="text-[11px] text-gray-500">Size {item.size}</p>
                    {item.toppings?.length > 0 && (
                      <p className="text-[10px] text-gray-400">+{item.toppings.join(', ')}</p>
                    )}
                  </div>
                  <span className="font-bold text-gray-800">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.lineTotal)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-3 flex justify-between items-center text-sm font-bold">
              <span>{paid ? 'Số tiền đã thanh toán mô phỏng' : 'Tổng tiền đơn hàng'}</span>
              <span className="text-amber-600 font-black">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.finalAmount)}
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          <Link
            href="/"
            className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl text-xs shadow-md flex items-center justify-center gap-1.5 transition-all"
          >
            <Home size={16} />
            Về trang chủ thực đơn
          </Link>
          <Link
            href="/orders"
            className="w-full py-3 bg-white hover:bg-gray-50 text-gray-700 font-bold rounded-2xl text-xs border border-gray-200 flex items-center justify-center gap-1.5 transition-all"
          >
            Xem lịch sử đơn hàng
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
