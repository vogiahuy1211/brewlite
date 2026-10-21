export const orderLabels = {
  PENDING: 'Đơn đang chờ thanh toán',
  PAID: 'Đã xác nhận thanh toán mô phỏng',
  PAYMENT_FAILED: 'Thanh toán thất bại',
  PREPARING: 'Đơn đang được chuẩn bị',
  READY: 'Đơn đã sẵn sàng',
  COMPLETED: 'Đơn đã hoàn tất',
  CANCELLED: 'Đơn đã hủy',
} as const;

export type ConfirmedOrder = {
  id: string;
  status: keyof typeof orderLabels;
  finalAmount: number;
  items: { id: string; productName: string; qty: number; size: string; lineTotal: number; toppings: string[] }[];
};

export function readOrder(value: unknown, expectedId: string): ConfirmedOrder {
  if (!value || typeof value !== 'object') throw new Error('Không xác minh được dữ liệu đơn hàng.');
  const order = value as Record<string, unknown>;
  if (order.id !== expectedId || typeof order.status !== 'string'
    || !Object.hasOwn(orderLabels, order.status)
    || typeof order.finalAmount !== 'number' || !Number.isFinite(order.finalAmount) || order.finalAmount < 0
    || !Array.isArray(order.items) || !order.items.every((item: unknown) => {
      if (!item || typeof item !== 'object') return false;
      const row = item as Record<string, unknown>;
      return typeof row.id === 'string' && typeof row.productName === 'string'
        && typeof row.qty === 'number' && Number.isInteger(row.qty) && row.qty > 0
        && typeof row.size === 'string'
        && typeof row.lineTotal === 'number' && Number.isFinite(row.lineTotal) && row.lineTotal >= 0
        && Array.isArray(row.toppings) && row.toppings.every(topping => typeof topping === 'string');
    })) throw new Error('Không xác minh được dữ liệu hoặc trạng thái đơn hàng.');
  return value as ConfirmedOrder;
}
