// Bản ghi dùng để chặn gửi lại; không phải API phục hồi và không tự gửi POST.
export const ATTEMPT_KEY = 'brewlite_checkout_attempt';
export type CheckoutAttempt = {
  version: 1;
  id: string;
  ownerId: string;
  sessionId: string;
  cartSignature: string;
  order: { items: { productId: string; size: string; qty: number; toppingIds: string[] }[]; promoCode?: string };
  payment: { orderId?: string; idempotencyKey: string; method: 'WALLET' | 'CARD' };
  amount?: number;
  phase: 'creating-order' | 'paying' | 'unconfirmed' | 'paid' | 'failed';
};

export function hasCheckoutAttempt() {
  // Để lỗi lưu trữ được truyền lên: chặn yêu cầu thay đổi dữ liệu trước khi gửi qua mạng.
  return sessionStorage.getItem(ATTEMPT_KEY) !== null;
}

export function ownsCheckoutAttempt(attempt: CheckoutAttempt) {
  try {
    const raw = sessionStorage.getItem(ATTEMPT_KEY);
    if (!raw) return false;
    const saved = JSON.parse(raw) as CheckoutAttempt;
    return saved.version === 1 && saved.id === attempt.id && saved.ownerId === attempt.ownerId
      && saved.sessionId === attempt.sessionId
      && saved.payment.idempotencyKey === attempt.payment.idempotencyKey
      && saved.payment.method === attempt.payment.method
      && saved.payment.orderId === attempt.payment.orderId;
  } catch { return false; }
}

export function claimCheckoutAttempt(attempt: CheckoutAttempt) {
  if (hasCheckoutAttempt()) throw new Error('Cần đối chiếu giao dịch trước.');
  sessionStorage.setItem(ATTEMPT_KEY, JSON.stringify(attempt));
  if (!ownsCheckoutAttempt(attempt)) throw new Error('Không thể bảo vệ yêu cầu thanh toán.');
}

export function updateCheckoutAttempt(previous: CheckoutAttempt, next: CheckoutAttempt) {
  if (!ownsCheckoutAttempt(previous)) throw new Error('Giao dịch không còn thuộc lần xử lý này.');
  sessionStorage.setItem(ATTEMPT_KEY, JSON.stringify(next));
}

export function finishCheckoutAttempt(attempt: CheckoutAttempt, phase: 'paid' | 'failed') {
  // Lỗi dọn dữ liệu lưu trữ không được đổi kết quả đã xác nhận thành UNCONFIRMED.
  try {
    if (!ownsCheckoutAttempt(attempt)) return;
    updateCheckoutAttempt(attempt, { ...attempt, phase });
    if (phase === 'paid' && ownsCheckoutAttempt(attempt)) sessionStorage.removeItem(ATTEMPT_KEY);
  } catch { /* Bản ghi cũ chặn POST khi tải lại trang; không bao giờ tự gửi lại. */ }
}
