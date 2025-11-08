import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { CheckoutService } from './checkout.service';
import { User } from '../auth/user.decorator';
import { Public } from '../auth/public.decorator';

@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Public() // TEMPORARY: Disabled auth for testing
  @Post('session')
  createSession(
    @Body()
    body: {
      eventId: string;
      sessionId: string;
      email: string;
      firstName: string;
      lastName: string;
      phone: string;
    },
    @User() user?: { userId: string },
  ) {
    return this.checkoutService.createSession({
      ...body,
      userId: user?.userId || 'test-user',
    });
  }

  @Public() // TEMPORARY: Disabled auth for testing
  @Get('order/:orderId')
  getOrderStatus(@Param('orderId') orderId: string) {
    return this.checkoutService.getOrderStatus(orderId);
  }

  @Public()
  @Post('simulate-payment')
  simulatePayment(@Body() body: { sessionId: string; success?: boolean }) {
    return this.checkoutService.simulatePayment(
      body.sessionId,
      body.success !== false,
    );
  }
}
