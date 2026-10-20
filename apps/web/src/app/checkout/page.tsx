'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Wallet, CreditCard, Tag, ShieldCheck } from 'lucide-react';
import { useCartStore } from '@/store/cart';
import { createOrder, processPayment, validatePromotion } from '@/services/api';
import type { CartItem } from '@/types/product';

function cartSignature(items: CartItem[]): string {
  return JSON.stringify(items.map((item) => JSON.stringify({
    productId: item.productId,
    qty: item.qty,
    size: item.size,
    price: item.price,
    toppingIds: item.toppings.map((topping) => topping.id).sort(),
  })).sort());
}

function paymentOutcome(
  response: unknown,
  orderId: string,
  method: 'WALLET' | 'CARD',
): 'PAID' | 'FAILED' | 'UNCONFIRMED' {
  if (!response || typeof response !== 'object') return 'UNCONFIRMED';
  const payment = response as Record<string, unknown>;
  if (typeof payment.id !== 'string' || !payment.id.trim()
    || typeof orderId !== 'string' || !orderId
    || payment.orderId !== orderId || payment.method !== method
    || typeof payment.amount !== 'number' || !Number.isFinite(payment.amount) || payment.amount < 0
    || typeof payment.isDuplicate !== 'boolean' || typeof payment.message !== 'string') {
    return 'UNCONFIRMED';
  }
  if (payment.status === 'SUCCESS' && payment.orderStatus === 'PAID') return 'PAID';
  if (payment.status === 'FAILED' && payment.orderStatus === 'PAYMENT_FAILED') return 'FAILED';
  return 'UNCONFIRMED';
}

export default function CheckoutPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const items = useCartStore((state) => state.items);
  const totalPrice = useCartStore((state) => state.getTotalPrice());

  const [paymentMethod, setPaymentMethod] = useState<'WALLET' | 'CARD'>('WALLET');
  const [promoCode, setPromoCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [promoMessage, setPromoMessage] = useState<string | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submissionLocked, setSubmissionLocked] = useState(false);
  // Keep this attempt locked until navigation; recovery is a separate flow.
  const submissionStarted = useRef(false);
  const lifecycle = useRef(0);

  useEffect(() => {
    const generation = ++lifecycle.current;
    return () => { lifecycle.current = generation + 1; };
  }, []);

  useEffect(() => {
    setMounted(true);
    // Kiểm tra đăng nhập
    const token = localStorage.getItem('brewlite_token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  if (!mounted) return null;

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
        <span className="text-5xl mb-2">🛒</span>
        <p className="text-sm font-bold text-gray-800">Không có món nào để thanh toán</p>
        <Link href="/" className="mt-4 px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-semibold">
          Quay lại chọn món
        </Link>
      </div>
    );
  }

  const finalAmount = Math.max(0, totalPrice - discountAmount);

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoError(null);
    setPromoMessage(null);
    try {
      const res = await validatePromotion(promoCode);
      setDiscountAmount(res.discountAmount);
      setPromoMessage(`Áp dụng thành công! Giảm ${new Intl.NumberFormat('vi-VN').format(res.discountAmount)}đ`);
    } catch (err: any) {
      setPromoError(err.response?.data?.message || 'Mã không hợp lệ hoặc đã hết hạn');
      setDiscountAmount(0);
    }
  };

  const handleCheckout = async () => {
    if (submissionStarted.current) return;
    const generation = lifecycle.current;
    const isCurrent = () => lifecycle.current === generation;
    let requestStarted = false;
    try {
      // Read the live store: the rendered items may already be stale.
      const currentItems = useCartStore.getState().items;
      if (!Array.isArray(currentItems) || currentItems.length === 0
        || currentItems.some((item) => !item
          || typeof item.productId !== 'string' || !item.productId.trim()
          || !['S', 'M', 'L'].includes(item.size)
          || !Number.isInteger(item.qty) || item.qty <= 0
          || !Number.isFinite(item.price) || item.price < 0
          || !Array.isArray(item.toppings)
          || item.toppings.some((topping) => !topping || typeof topping.id !== 'string' || !topping.id.trim()))
        || !Number.isFinite(currentItems.reduce((sum, item) => sum + item.price * item.qty, 0))) {
        setError('Giỏ hàng trống hoặc không hợp lệ. Vui lòng kiểm tra lại trước khi thanh toán.');
        return;
      }
      const submittedCart = cartSignature(currentItems);
      const orderPayload = {
        items: currentItems.map((i) => ({
          productId: i.productId,
          size: i.size,
          qty: i.qty,
          toppingIds: i.toppings.map((t) => t.id),
        })),
        promoCode: discountAmount > 0 ? promoCode : undefined,
      };
      // 1. Sinh Idempotency-Key (UUID v4)
      const idempotencyKey = crypto.randomUUID();

      // Lock only after local preparation succeeds, immediately before dispatch.
      submissionStarted.current = true;
      setSubmissionLocked(true);
      setError(null);
      setLoading(true);
      requestStarted = true;
      // 2. Tạo đơn hàng PENDING
      const orderRes = await createOrder(orderPayload);
      if (!isCurrent()) return;

      // 3. Tiến hành thanh toán qua Mock Payment
      const paymentRes = await processPayment({
        orderId: orderRes.id,
        idempotencyKey,
        method: paymentMethod,
      });
      if (!isCurrent()) return;

      const outcome = paymentOutcome(paymentRes, orderRes.id, paymentMethod);
      if (outcome !== 'PAID') {
        setError(outcome === 'FAILED'
          ? 'PAYMENT_FAILED: Backend đã xác nhận thanh toán thất bại. Giỏ hàng được giữ nguyên. Vui lòng kiểm tra đơn trong Lịch sử đơn trước khi bắt đầu lại.'
          : 'UNCONFIRMED: Chưa xác nhận được kết quả giao dịch. Giỏ hàng được giữ nguyên. Vui lòng đối chiếu trạng thái đơn; không tạo thanh toán mới.');
        return;
      }

      // Chỉ xóa giỏ và điều hướng sau phản hồi thanh toán hợp lệ.
      const cart = useCartStore.getState();
      // Malformed or changed live data must never erase the current cart.
      let unchanged = false;
      try { unchanged = cartSignature(cart.items) === submittedCart; } catch { /* Preserve cart. */ }
      if (unchanged) cart.clearCart();
      router.push(`/orders/${orderRes.id}`);
    } catch {
      if (!isCurrent()) return;
      if (!requestStarted) {
        setError('Không thể chuẩn bị yêu cầu thanh toán. Chưa gửi yêu cầu; vui lòng kiểm tra và thử lại.');
        return;
      }
      // A transport error does not prove whether the server committed the operation.
      setError('UNCONFIRMED: Không xác nhận được kết quả tạo đơn hoặc thanh toán. Giỏ hàng được giữ nguyên. Vui lòng đối chiếu trạng thái đơn; không tạo thanh toán mới.');
    } finally {
      if (isCurrent()) setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-3 max-w-lg mx-auto flex items-center gap-2">
        <Link href="/cart" className="p-2 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h2 className="text-base font-bold text-gray-800">Thanh toán không dùng tiền mặt</h2>
      </div>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Phương thức thanh toán */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Chọn phương thức thanh toán</h3>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setPaymentMethod('WALLET')}
              className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                paymentMethod === 'WALLET'
                  ? 'border-amber-500 bg-amber-50/50 text-amber-900 font-bold'
                  : 'border-gray-200 text-gray-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-pink-100 text-pink-600 flex items-center justify-center">
                  <Wallet size={18} />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold">Ví điện tử (MoMo / ZaloPay)</p>
                  <p className="text-[10px] text-gray-500">Thanh toán tức thì</p>
                </div>
              </div>
              <div
                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  paymentMethod === 'WALLET' ? 'border-amber-600' : 'border-gray-300'
                }`}
              >
                {paymentMethod === 'WALLET' && <div className="w-2 h-2 rounded-full bg-amber-600" />}
              </div>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('CARD')}
              className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                paymentMethod === 'CARD'
                  ? 'border-amber-500 bg-amber-50/50 text-amber-900 font-bold'
                  : 'border-gray-200 text-gray-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                  <CreditCard size={18} />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold">Thẻ ATM / Thẻ Quốc tế</p>
                  <p className="text-[10px] text-gray-500">Visa, Mastercard, JCB</p>
                </div>
              </div>
              <div
                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  paymentMethod === 'CARD' ? 'border-amber-600' : 'border-gray-300'
                }`}
              >
                {paymentMethod === 'CARD' && <div className="w-2 h-2 rounded-full bg-amber-600" />}
              </div>
            </button>
          </div>
        </div>

        {/* Mã khuyến mãi */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-1.5">
            <Tag size={16} className="text-amber-500" />
            Mã giảm giá
          </h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              placeholder="VD: WELCOME10"
              className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-xs uppercase font-bold tracking-wider focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button
              type="button"
              onClick={handleApplyPromo}
              className="px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-black"
            >
              Áp dụng
            </button>
          </div>
          {promoMessage && <p className="text-xs text-green-600 font-semibold mt-2">{promoMessage}</p>}
          {promoError && <p className="text-xs text-red-500 font-semibold mt-2">{promoError}</p>}
        </div>

        {/* Chi tiết hóa đơn */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-2 text-xs">
          <div className="flex justify-between text-gray-600">
            <span>Tạm tính</span>
            <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalPrice)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-green-600 font-semibold">
              <span>Khuyến mãi</span>
              <span>
                -{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(discountAmount)}
              </span>
            </div>
          )}
          <div className="border-t border-gray-100 pt-2 flex justify-between text-sm font-bold text-gray-900">
            <span>Tổng số tiền cần trả</span>
            <span className="text-base text-amber-600">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(finalAmount)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-1 text-[11px] text-gray-400">
          <ShieldCheck size={14} />
          Giao dịch được bảo mật và chống trừ tiền trùng lặp
        </div>
      </main>

      {/* Action CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 z-30 shadow-md">
        <div className="max-w-lg mx-auto">
          <button
            onClick={handleCheckout}
            disabled={loading || submissionLocked}
            className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 active:scale-95 disabled:opacity-50 text-white font-bold rounded-2xl text-sm transition-all shadow-md flex items-center justify-center gap-2"
          >
            {loading ? 'Đang thực hiện thanh toán...' : submissionLocked ? 'Đã gửi yêu cầu — cần đối chiếu trạng thái đơn' : `Xác nhận trả ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(finalAmount)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
