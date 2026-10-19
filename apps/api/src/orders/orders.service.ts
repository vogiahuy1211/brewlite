import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { order_status, item_size } from '@prisma/client';
import { assertTransition } from './order-state-machine';

// Phụ thu theo Size
const SIZE_SURCHARGE: Record<item_size, number> = {
  S: 0,
  M: 5000,
  L: 10000,
};

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateOrderDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Giỏ hàng không có sản phẩm nào');
    }

    // Thực hiện trong một Database Transaction với Optimistic Locking
    return this.prisma.$transaction(async (tx) => {
      let subtotal = 0;
      const orderItemsToCreate: Array<{
        product_id: string;
        size: item_size;
        qty: number;
        unit_price: number;
        line_total: number;
        toppings: Array<{ topping_id: string; price: number }>;
      }> = [];

      for (const item of dto.items) {
        // 1. Kiểm tra tồn kho và version sản phẩm
        const product = await tx.products.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          throw new NotFoundException(`Sản phẩm với ID ${item.productId} không tồn tại`);
        }

        if (product.stock < item.qty) {
          throw new ConflictException(
            `Sản phẩm "${product.name}" không đủ tồn kho (còn ${product.stock}, yêu cầu ${item.qty})`,
          );
        }

        // 2. Trừ tồn kho bằng Optimistic Locking (WHERE version = product.version)
        const updateResult = await tx.products.updateMany({
          where: {
            id: item.productId,
            version: product.version,
            stock: { gte: item.qty },
          },
          data: {
            stock: { decrement: item.qty },
            version: { increment: 1 },
          },
        });

        if (updateResult.count === 0) {
          throw new ConflictException(
            `Xung đột khi đặt món "${product.name}", có người đã đặt trước. Vui lòng thử lại!`,
          );
        }

        // 3. Tính tiền theo size và toppings
        const basePrice = Number(product.price);
        const sizeSurcharge = SIZE_SURCHARGE[item.size] || 0;
        let toppingsPrice = 0;
        const itemToppingsList: Array<{ topping_id: string; price: number }> = [];

        if (item.toppingIds && item.toppingIds.length > 0) {
          const toppings = await tx.toppings.findMany({
            where: { id: { in: item.toppingIds } },
          });

          for (const top of toppings) {
            const topPrice = Number(top.price);
            toppingsPrice += topPrice;
            itemToppingsList.push({ topping_id: top.id, price: topPrice });
          }
        }

        const unitPrice = basePrice + sizeSurcharge + toppingsPrice;
        const lineTotal = unitPrice * item.qty;
        subtotal += lineTotal;

        orderItemsToCreate.push({
          product_id: item.productId,
          size: item.size,
          qty: item.qty,
          unit_price: unitPrice,
          line_total: lineTotal,
          toppings: itemToppingsList,
        });
      }

      // 4. Áp mã khuyến mãi nếu có
      let discountAmount = 0;
      let promoId: string | null = null;

      if (dto.promoCode) {
        const promo = await tx.promotions.findUnique({
          where: { code: dto.promoCode.toUpperCase() },
        });

        if (promo && promo.is_active) {
          const now = new Date();
          const isStarted = !promo.start_at || promo.start_at <= now;
          const isNotExpired = !promo.end_at || promo.end_at >= now;

          if (isStarted && isNotExpired) {
            discountAmount = Math.min(Number(promo.discount_amount), subtotal);
            promoId = promo.id;
          }
        }
      }

      const finalAmount = Math.max(0, subtotal - discountAmount);

      // 5. Tạo đơn hàng với trạng thái PENDING
      const order = await tx.orders.create({
        data: {
          user_id: userId,
          promo_id: promoId,
          status: order_status.PENDING,
          subtotal,
          discount_amount: discountAmount,
          final_amount: finalAmount,
        },
      });

      // 6. Tạo các OrderItems và OrderItemToppings
      for (const oItem of orderItemsToCreate) {
        const createdItem = await tx.orderItems.create({
          data: {
            order_id: order.id,
            product_id: oItem.product_id,
            size: oItem.size,
            qty: oItem.qty,
            unit_price: oItem.unit_price,
            line_total: oItem.line_total,
          },
        });

        if (oItem.toppings.length > 0) {
          await tx.orderItemToppings.createMany({
            data: oItem.toppings.map((t) => ({
              order_item_id: createdItem.id,
              topping_id: t.topping_id,
              price_at_purchase: t.price,
            })),
          });
        }
      }

      return {
        id: order.id,
        status: order.status,
        subtotal,
        discountAmount,
        finalAmount,
        createdAt: order.created_at,
      };
    });
  }

  async findUserOrders(userId: string) {
    const orders = await this.prisma.orders.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      include: {
        OrderItems: {
          include: {
            Products: true,
            OrderItemToppings: {
              include: { Toppings: true },
            },
          },
        },
        Payments: true,
        Promotions: true,
      },
    });

    return orders.map((o) => ({
      id: o.id,
      status: o.status,
      subtotal: Number(o.subtotal),
      discountAmount: Number(o.discount_amount),
      finalAmount: Number(o.final_amount),
      createdAt: o.created_at,
      items: o.OrderItems.map((oi) => ({
        id: oi.id,
        productName: oi.Products.name,
        imageUrl: oi.Products.image_url,
        size: oi.size,
        qty: oi.qty,
        unitPrice: Number(oi.unit_price),
        lineTotal: Number(oi.line_total),
        toppings: oi.OrderItemToppings.map((t) => t.Toppings.name),
      })),
      payments: o.Payments.map((p) => ({
        id: p.id,
        method: p.method,
        status: p.status,
        amount: Number(p.amount),
      })),
    }));
  }

  async findOne(orderId: string, userId: string) {
    const order = await this.prisma.orders.findFirst({
      where: { id: orderId, user_id: userId },
      include: {
        OrderItems: {
          include: {
            Products: true,
            OrderItemToppings: {
              include: { Toppings: true },
            },
          },
        },
        Payments: true,
        Promotions: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Đơn hàng không tồn tại');
    }

    return {
      id: order.id,
      status: order.status,
      subtotal: Number(order.subtotal),
      discountAmount: Number(order.discount_amount),
      finalAmount: Number(order.final_amount),
      createdAt: order.created_at,
      items: order.OrderItems.map((oi) => ({
        id: oi.id,
        productName: oi.Products.name,
        imageUrl: oi.Products.image_url,
        size: oi.size,
        qty: oi.qty,
        unitPrice: Number(oi.unit_price),
        lineTotal: Number(oi.line_total),
        toppings: oi.OrderItemToppings.map((t) => t.Toppings.name),
      })),
    };
  }

  async updateStatus(orderId: string, nextStatus: order_status) {
    const order = await this.prisma.orders.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Đơn hàng không tồn tại');
    }

    // State machine check
    assertTransition(order.status, nextStatus);

    return this.prisma.orders.update({
      where: { id: orderId },
      data: { status: nextStatus },
    });
  }
}
