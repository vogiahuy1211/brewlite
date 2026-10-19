import { BadRequestException } from '@nestjs/common';
import { order_status } from '@prisma/client';

export const ALLOWED_TRANSITIONS: Record<order_status, order_status[]> = {
  [order_status.PENDING]: [
    order_status.PAID,
    order_status.PAYMENT_FAILED,
    order_status.CANCELLED,
  ],
  [order_status.PAYMENT_FAILED]: [
    order_status.PENDING,
    order_status.CANCELLED,
  ],
  [order_status.PAID]: [
    order_status.PREPARING,
    order_status.CANCELLED,
  ],
  [order_status.PREPARING]: [
    order_status.READY,
  ],
  [order_status.READY]: [
    order_status.COMPLETED,
  ],
  [order_status.COMPLETED]: [],
  [order_status.CANCELLED]: [],
};

export function assertTransition(current: order_status, next: order_status): void {
  const allowed = ALLOWED_TRANSITIONS[current] || [];
  if (!allowed.includes(next)) {
    throw new BadRequestException(
      `Không thể chuyển trạng thái đơn hàng từ ${current} sang ${next}. Trạng thái hợp lệ tiếp theo: [${allowed.join(', ')}]`,
    );
  }
}
