import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { ProcessPaymentDto } from './dto/payment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  processPayment(@Request() req: any, @Body() dto: ProcessPaymentDto) {
    return this.paymentsService.processPayment(req.user.id, dto);
  }
}
