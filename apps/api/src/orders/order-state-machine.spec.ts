import { BadRequestException } from '@nestjs/common';
import { order_status } from '@prisma/client';
import { assertTransition } from './order-state-machine';

describe('Order State Machine', () => {
  it('cho phép chuyển PENDING -> PAID', () => {
    expect(() => assertTransition(order_status.PENDING, order_status.PAID)).not.toThrow();
  });

  it('cho phép chuyển PENDING -> PAYMENT_FAILED', () => {
    expect(() => assertTransition(order_status.PENDING, order_status.PAYMENT_FAILED)).not.toThrow();
  });

  it('cho phép chuyển PENDING -> CANCELLED', () => {
    expect(() => assertTransition(order_status.PENDING, order_status.CANCELLED)).not.toThrow();
  });

  it('cho phép chuyển PAID -> PREPARING', () => {
    expect(() => assertTransition(order_status.PAID, order_status.PREPARING)).not.toThrow();
  });

  it('cho phép chuyển PREPARING -> READY', () => {
    expect(() => assertTransition(order_status.PREPARING, order_status.READY)).not.toThrow();
  });

  it('cho phép chuyển READY -> COMPLETED', () => {
    expect(() => assertTransition(order_status.READY, order_status.COMPLETED)).not.toThrow();
  });

  it('chặn nhảy cóc sai quy trình: PENDING -> COMPLETED', () => {
    expect(() => assertTransition(order_status.PENDING, order_status.COMPLETED)).toThrow(BadRequestException);
  });

  it('chặn nhảy cóc sai quy trình: PENDING -> READY', () => {
    expect(() => assertTransition(order_status.PENDING, order_status.READY)).toThrow(BadRequestException);
  });

  it('chặn chuyển tiếp từ trạng thái kết thúc COMPLETED', () => {
    expect(() => assertTransition(order_status.COMPLETED, order_status.PAID)).toThrow(BadRequestException);
  });

  it('chặn chuyển tiếp từ trạng thái kết thúc CANCELLED', () => {
    expect(() => assertTransition(order_status.CANCELLED, order_status.PENDING)).toThrow(BadRequestException);
  });
});
