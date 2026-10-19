import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductDto } from './dto/product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<ProductDto[]> {
    const products = await this.prisma.products.findMany({
      orderBy: { name: 'asc' },
    });

    return products.map((p) => ({
      id: p.id,
      name: p.name,
      price: Number(p.price),
      imageUrl: p.image_url,
      stock: p.stock,
    }));
  }

  async findOne(id: string): Promise<ProductDto> {
    const product = await this.prisma.products.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Sản phẩm với id "${id}" không tồn tại`);
    }

    return {
      id: product.id,
      name: product.name,
      price: Number(product.price),
      imageUrl: product.image_url,
      stock: product.stock,
    };
  }
}
