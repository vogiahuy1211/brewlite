import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { item_size, payment_method, order_status } from '@prisma/client';

describe('Task 10 Core Business Integration Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let testUserId: string;
  let testProduct: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    app.setGlobalPrefix('api');
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // 1. Dọn dẹp và chuẩn bị user test
    const testEmail = `test_integration_${Date.now()}@brewlite.com`;
    const regRes = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: testEmail,
        password: 'password123',
      });

    testUserId = regRes.body.user.id;
    authToken = regRes.body.access_token;

    // 2. Tạo một sản phẩm mẫu riêng cho test với số lượng tồn kho giới hạn
    testProduct = await prisma.products.create({
      data: {
        name: `Trà Đặc Biệt Test ${Date.now()}`,
        price: 30000,
        stock: 5,
        version: 0,
      },
    });
  }, 30000);

  afterAll(async () => {
    // Dọn dẹp dữ liệu test
    if (testProduct) {
      await prisma.orderItems.deleteMany({ where: { product_id: testProduct.id } });
      await prisma.products.delete({ where: { id: testProduct.id } }).catch(() => {});
    }
    if (testUserId) {
      await prisma.payments.deleteMany({ where: { Orders: { user_id: testUserId } } });
      await prisma.orders.deleteMany({ where: { user_id: testUserId } });
      await prisma.users.delete({ where: { id: testUserId } }).catch(() => {});
    }
    await app.close();
  });

  // =========================================================================
  // Yêu cầu 1 & Tiêu chí (b): Thanh toán Idempotent (Idempotency-Key)
  // Gửi 2 lần cùng Idempotency-Key chỉ tạo 1 bản ghi giao dịch, không trừ tiền 2 lần
  // =========================================================================
  describe('Yêu cầu (b): Idempotent Payment', () => {
    it('gửi 2 lần cùng Idempotency-Key chỉ tạo 1 đơn/giao dịch duy nhất', async () => {
      // Tạo một đơn hàng PENDING
      const orderRes = await request(app.getHttpServer())
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items: [
            {
              productId: testProduct.id,
              size: item_size.S,
              qty: 1,
            },
          ],
        });

      expect(orderRes.status).toBe(201);
      const orderId = orderRes.body.id;
      const idempotencyKey = `idem_key_${Date.now()}_test`;

      // Request lần 1: Thanh toán thành công
      const firstPayment = await request(app.getHttpServer())
        .post('/api/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          orderId,
          idempotencyKey,
          method: payment_method.WALLET,
        });

      expect(firstPayment.status).toBe(201);
      expect(firstPayment.body.isDuplicate).toBe(false);
      expect(firstPayment.body.orderStatus).toBe(order_status.PAID);

      // Request lần 2: Gửi lại y hệt cùng idempotencyKey (mô phỏng retry do mạng lag)
      const secondPayment = await request(app.getHttpServer())
        .post('/api/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          orderId,
          idempotencyKey,
          method: payment_method.WALLET,
        });

      expect(secondPayment.status).toBe(201);
      expect(secondPayment.body.isDuplicate).toBe(true);
      expect(secondPayment.body.id).toBe(firstPayment.body.id); // Cùng 1 ID thanh toán

      // Kiểm tra trong database: chỉ có đúng 1 bản ghi payment được tạo cho key này
      const dbPayments = await prisma.payments.findMany({
        where: { idempotency_key: idempotencyKey },
      });
      expect(dbPayments.length).toBe(1);
    });
  });

  // =========================================================================
  // Yêu cầu 2 & Tiêu chí (c): Kiểm soát tồn kho khi đặt đồng thời (Concurrency)
  // =========================================================================
  describe('Yêu cầu (c): Concurrency Control & Optimistic Locking', () => {
    it('đặt hàng đồng thời không vượt quá số lượng tồn kho còn lại (không bán âm)', async () => {
      // Tạo 1 sản phẩm có tồn kho duy nhất đúng = 2 ly
      const limitedProduct = await prisma.products.create({
        data: {
          name: `Trà Trái Cây Giới Hạn ${Date.now()}`,
          price: 25000,
          stock: 2,
          version: 0,
        },
      });

      // Tạo đồng thời 3 request, mỗi request mua 1 ly (Tổng cầu: 3 > Tồn kho: 2)
      const promises = [1, 2, 3].map(() =>
        request(app.getHttpServer())
          .post('/api/orders')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            items: [
              {
                productId: limitedProduct.id,
                size: item_size.S,
                qty: 1,
              },
            ],
          }),
      );

      const results = await Promise.all(promises);

      // Phân loại kết quả thành công và thất bại
      const successOrders = results.filter((r) => r.status === 201);
      const conflictOrders = results.filter((r) => r.status === 409);

      // Tồn kho = 2 nên chỉ tối đa 2 đơn được tạo thành công
      expect(successOrders.length).toBeLessThanOrEqual(2);
      expect(conflictOrders.length).toBeGreaterThanOrEqual(1);

      // Kiểm tra lại tồn kho trong CSDL: stock không bao giờ bị âm
      const finalProduct = await prisma.products.findUnique({
        where: { id: limitedProduct.id },
      });
      expect(finalProduct!.stock).toBeGreaterThanOrEqual(0);

      // Dọn dẹp
      await prisma.orderItems.deleteMany({ where: { product_id: limitedProduct.id } });
      await prisma.products.delete({ where: { id: limitedProduct.id } });
    });
  });

  // =========================================================================
  // Yêu cầu 3 & Tiêu chí (a): Order State Machine chuyển trạng thái hợp lệ/bất hợp lệ
  // =========================================================================
  describe('Yêu cầu (a): Order State Machine qua API', () => {
    it('chặn cập nhật trạng thái nhảy cóc bất hợp lệ (ví dụ: PENDING -> COMPLETED)', async () => {
      const orderRes = await request(app.getHttpServer())
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items: [
            {
              productId: testProduct.id,
              size: item_size.S,
              qty: 1,
            },
          ],
        });

      const orderId = orderRes.body.id;

      // Cố tình gửi request chuyển từ PENDING nhảy cóc sang COMPLETED
      const invalidTransitionRes = await request(app.getHttpServer())
        .patch(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: order_status.COMPLETED,
        });

      expect(invalidTransitionRes.status).toBe(400);
      expect(invalidTransitionRes.body.message).toContain('Không thể chuyển trạng thái đơn hàng');

      // Chuyển hợp lệ sang CANCELLED
      const validTransitionRes = await request(app.getHttpServer())
        .patch(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: order_status.CANCELLED,
        });

      expect(validTransitionRes.status).toBe(200);
      expect(validTransitionRes.body.status).toBe(order_status.CANCELLED);
    });
  });
});
