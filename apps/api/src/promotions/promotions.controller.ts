import { Controller, Get, Query } from '@nestjs/common';
import { PromotionsService } from './promotions.service';

@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Get('validate')
  validateCode(@Query('code') code: string) {
    return this.promotionsService.validateCode(code);
  }
}
