import { Injectable } from '@nestjs/common';

@Injectable()
export class CheckoutService {
  createSession() {
    return {
      message: 'Checkout session endpoint - Coming soon',
    };
  }
}
