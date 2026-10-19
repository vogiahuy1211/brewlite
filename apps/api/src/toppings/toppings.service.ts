import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ToppingsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const toppings = await this.prisma.toppings.findMany({
      orderBy: { price: 'asc' },
    });
    return toppings.map((t) => ({
      id: t.id,
      name: t.name,
      price: Number(t.price),
    }));
  }
}
