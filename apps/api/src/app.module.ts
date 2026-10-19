import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { ToppingsModule } from './toppings/toppings.module';
import { PromotionsModule } from './promotions/promotions.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    ProductsModule,
    ToppingsModule,
    PromotionsModule,
    OrdersModule,
    PaymentsModule,
    HealthModule,
  ],
})
export class AppModule {}
