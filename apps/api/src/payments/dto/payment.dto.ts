import { IsUUID, IsEnum, IsNotEmpty, IsString, IsBoolean, IsOptional } from 'class-validator';
import { payment_method } from '@prisma/client';

export class ProcessPaymentDto {
  @IsUUID('4', { message: 'orderId phải là UUID hợp lệ' })
  orderId: string;

  @IsString({ message: 'idempotencyKey không được để trống' })
  @IsNotEmpty({ message: 'idempotencyKey không được để trống' })
  idempotencyKey: string;

  @IsEnum(payment_method, { message: 'Phương thức thanh toán phải là WALLET hoặc CARD' })
  method: payment_method;

  @IsBoolean()
  @IsOptional()
  simulateFailure?: boolean; // Tùy chọn để test kịch bản thanh toán thất bại
}
