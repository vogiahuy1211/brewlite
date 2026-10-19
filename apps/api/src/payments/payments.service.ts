import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProcessPaymentDto } from './dto/payment.dto';
import { order_status, payment_status } from '@prisma/client';
import { assertTransition } from '../orders/order-state-machine';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async processPayment(userId: string, dto: ProcessPaymentDto) {
    // 1. Kiểm tra Idempotency-Key đã được sử dụng trước đó chưa
    const existingPayment = await this.prisma.payments.findUnique({
      where: { idempotency_key: dto.idempotencyKey },
      include: { Orders: true },
    });

    if (existingPayment) {
      // Trả lại kết quả giao dịch trước đó, KHÔNG trừ tiền hay xử lý lại
      return {
        isDuplicate: true,
        id: existingPayment.id,
        orderId: existingPayment.order_id,
        status: existingPayment.status,
        method: existingPayment.method,
        amount: Number(existingPayment.amount),
        orderStatus: existingPayment.Orders.status,
        message: 'Yêu cầu thanh toán trùng lặp (Idempotent replay)',
      };
    }

    // 2. Tìm đơn hàng
    const order = await this.prisma.orders.findFirst({
      where: { id: dto.orderId, user_id: userId },
    });

    if (!order) {
      throw new NotFoundException('Đơn hàng không tồn tại');
    }

    // Kiểm tra đơn hàng có thể thanh toán không (chỉ PENDING mới được thanh toán)
    if (order.status !== order_status.PENDING && order.status !== order_status.PAYMENT_FAILED) {
      throw new BadRequestException(`Đơn hàng hiện ở trạng thái ${order.status}, không thể thanh toán`);
    }

    // 3. Mô phỏng cổng thanh toán (Mock Payment)
    const isSuccess = !dto.simulateFailure;
    const targetStatus = isSuccess ? order_status.PAID : order_status.PAYMENT_FAILED;
    const paymentRecordStatus = isSuccess ? payment_status.SUCCESS : payment_status.FAILED;

    // Kiểm tra tính hợp lệ của State Machine
    assertTransition(order.status, targetStatus);

    return this.prisma.$transaction(async (tx) => {
      // Lưu bản ghi Payment
      const payment = await tx.payments.create({
        data: {
          order_id: order.id,
          idempotency_key: dto.idempotencyKey,
          amount: order.final_amount,
          method: dto.method,
          status: paymentRecordStatus,
        },
      });

      // Cập nhật trạng thái đơn hàng
      await tx.orders.update({
        where: { id: order.id },
        data: { status: targetStatus },
      });

      // Nếu thanh toán thành công, cộng điểm thưởng (10.000đ = 1 điểm)
      if (isSuccess) {
        const earnedPoints = Math.floor(Number(order.final_amount) / 10000);
        if (earnedPoints > 0) {
          await tx.users.update({
            where: { id: userId },
            data: { loyalty_points: { increment: earnedPoints } },
          });
        }
      }

      return {
        isDuplicate: false,
        id: payment.id,
        orderId: order.id,
        status: payment.status,
        method: payment.method,
        amount: Number(payment.amount),
        orderStatus: targetStatus,
        message: isSuccess ? 'Thanh toán thành công' : 'Thanh toán thất bại',
      };
    });
  }
}
