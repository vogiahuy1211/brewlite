import { IsUUID, IsEnum, IsInt, Min, IsArray, ValidateNested, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { item_size } from '@prisma/client';

export class OrderItemDto {
  @IsUUID('4', { message: 'productId phải là UUID hợp lệ' })
  productId: string;

  @IsEnum(item_size, { message: 'Size phải là S, M hoặc L' })
  size: item_size;

  @IsInt({ message: 'Số lượng phải là số nguyên' })
  @Min(1, { message: 'Số lượng tối thiểu là 1' })
  qty: number;

  @IsArray()
  @IsUUID('4', { each: true, message: 'toppingId phải là UUID hợp lệ' })
  @IsOptional()
  toppingIds?: string[];
}

export class CreateOrderDto {
  @IsArray({ message: 'Danh sách sản phẩm phải là một mảng' })
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsString()
  @IsOptional()
  promoCode?: string;
}
