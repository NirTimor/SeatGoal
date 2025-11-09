import { Controller, Post, Delete, Patch, Body, Param } from '@nestjs/common';
import { CartService } from './cart.service';
import { User } from '../auth/user.decorator';
import { Public } from '../auth/public.decorator';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post('hold')
  holdSeats(
    @Body()
    body: {
      eventId: string;
      seatIds: string[];
      sessionId: string;
    },
    @User() user: { userId: string },
  ) {
    return this.cartService.holdSeats({
      ...body,
      userId: user.userId,
    });
  }

  @Delete('hold/:eventId/:sessionId')
  releaseHold(
    @Param('eventId') eventId: string,
    @Param('sessionId') sessionId: string,
  ) {
    return this.cartService.releaseHold(eventId, sessionId);
  }

  @Patch('hold/:eventId/:sessionId/extend')
  extendHold(
    @Param('eventId') eventId: string,
    @Param('sessionId') sessionId: string,
  ) {
    return this.cartService.extendHold(eventId, sessionId);
  }
}
