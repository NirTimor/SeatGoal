import { Injectable } from '@nestjs/common';

@Injectable()
export class CartService {
  holdSeats() {
    return {
      message: 'Cart hold endpoint - Coming soon',
    };
  }
}

