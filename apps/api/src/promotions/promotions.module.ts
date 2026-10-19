import { Module } from '@nestjs/common';
import { PromotionsService } from './promotions.service';
import { PromotionsController } from './promotions.controller';

@Module({
  controllers: [PromotionsController],
  providers: [PromotionsService],
  exports: [PromotionsService],
})
export class PromotionsModule {}
