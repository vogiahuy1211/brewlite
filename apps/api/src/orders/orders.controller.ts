import { Controller, Post, Body, Get, Param, UseGuards, Request, Patch } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { order_status } from '@prisma/client';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Request() req: any, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(req.user.id, dto);
  }

  @Get('me')
  getMyOrders(@Request() req: any) {
    return this.ordersService.findUserOrders(req.user.id);
  }

  @Get(':id')
  getOrder(@Request() req: any, @Param('id') id: string) {
    return this.ordersService.findOne(id, req.user.id);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: order_status) {
    return this.ordersService.updateStatus(id, status);
  }
}
