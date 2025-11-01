import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { OrdersService } from './orders.service';
import { OrderFilterDto } from './dto/order.dto';

@Controller('orders')
@UseGuards(AuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  async getOrderHistory(@Request() req, @Query() filter: OrderFilterDto) {
    return this.ordersService.getOrderHistory(req.user.userId, filter);
  }

  @Get('upcoming')
  async getUpcomingOrders(@Request() req) {
    return this.ordersService.getUpcomingOrders(req.user.userId);
  }

  @Get('past')
  async getPastOrders(@Request() req) {
    return this.ordersService.getPastOrders(req.user.userId);
  }

  @Get('stats')
  async getOrderStats(@Request() req) {
    return this.ordersService.getOrderStats(req.user.userId);
  }

  @Get(':id')
  async getOrderById(@Request() req, @Param('id') id: string) {
    return this.ordersService.getOrderById(req.user.userId, id);
  }

  @Get(':id/receipt')
  async downloadReceipt(@Request() req, @Param('id') id: string) {
    return this.ordersService.downloadReceipt(req.user.userId, id);
  }
}
