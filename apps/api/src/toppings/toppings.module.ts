import { Module } from '@nestjs/common';
import { ToppingsService } from './toppings.service';
import { ToppingsController } from './toppings.controller';

@Module({
  controllers: [ToppingsController],
  providers: [ToppingsService],
  exports: [ToppingsService],
})
export class ToppingsModule {}
