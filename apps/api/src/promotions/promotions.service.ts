import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PromotionsService {
  constructor(private readonly prisma: PrismaService) {}

  async validateCode(code: string) {
    const promo = await this.prisma.promotions.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!promo || !promo.is_active) {
      throw new NotFoundException('Mã khuyến mãi không tồn tại hoặc đã hết hiệu lực');
    }

    const now = new Date();
    if (promo.start_at && promo.start_at > now) {
      throw new NotFoundException('Mã khuyến mãi chưa đến thời gian áp dụng');
    }

    if (promo.end_at && promo.end_at < now) {
      throw new NotFoundException('Mã khuyến mãi đã hết hạn sử dụng');
    }

    return {
      id: promo.id,
      code: promo.code,
      discountAmount: Number(promo.discount_amount),
    };
  }
}
