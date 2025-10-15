import { Injectable } from '@nestjs/common';

@Injectable()
export class WebhooksService {
  handlePayment() {
    return {
      message: 'Webhook endpoint - Coming soon',
    };
  }
}

