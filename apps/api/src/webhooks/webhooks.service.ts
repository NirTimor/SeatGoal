import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { StripeService } from '../stripe/stripe.service';
import Stripe from 'stripe';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private stripe: StripeService,
  ) {}

  async handleStripeWebhook(rawBody: Buffer, signature: string) {
    let event: Stripe.Event;

    try {
      // Verify webhook signature
      event = this.stripe.verifyWebhookSignature(rawBody, signature);
    } catch (error) {
      this.logger.error(`Webhook signature verification failed: ${error.message}`);
      throw new BadRequestException('Invalid signature');
    }

    this.logger.log(`Received Stripe webhook: ${event.type}`);

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session,
        );
        break;

      case 'checkout.session.expired':
        await this.handleCheckoutSessionExpired(
          event.data.object as Stripe.Checkout.Session,
        );
        break;

      case 'payment_intent.succeeded':
        this.logger.log(`PaymentIntent succeeded: ${event.data.object.id}`);
        break;

      case 'payment_intent.payment_failed':
        this.logger.log(`PaymentIntent failed: ${event.data.object.id}`);
        break;

      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }

    return { received: true };
  }

  private async handleCheckoutSessionCompleted(
    session: Stripe.Checkout.Session,
  ) {
    const orderId = session.metadata?.orderId;

    if (!orderId) {
      this.logger.error('No orderId in session metadata');
      return;
    }

    this.logger.log(`Processing successful payment for order: ${orderId}`);

    try {
      // Get payment session from Redis
      const paymentSession = await this.redis.get<{
        orderId: string;
        sessionId: string;
        eventId: string;
        userId: string;
      }>(`payment:session:${session.id}`);

      if (!paymentSession) {
        this.logger.warn(`Payment session not found in Redis: ${session.id}`);
        // Continue anyway using order data from database
      }

      // Update order to PAID
      const order = await this.prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'PAID',
          paymentIntentId: session.payment_intent as string,
        },
        include: {
          orderItems: true,
        },
      });

      // Update ticket inventory to SOLD
      const ticketInventoryIds = order.orderItems.map(
        (item) => item.ticketInventoryId,
      );

      await this.prisma.ticketInventory.updateMany({
        where: {
          id: { in: ticketInventoryIds },
        },
        data: {
          status: 'SOLD',
          holdExpiresAt: null,
        },
      });

      // Release Redis holds if session info exists
      if (paymentSession) {
        const heldSeats = await this.redis.getHeldSeats(
          paymentSession.eventId,
          paymentSession.sessionId,
        );
        if (heldSeats.length > 0) {
          await this.redis.releaseSeats(
            paymentSession.eventId,
            heldSeats,
            paymentSession.sessionId,
          );
        }

        // Delete payment session
        await this.redis.del(`payment:session:${session.id}`);
      }

      this.logger.log(`Order ${orderId} marked as PAID`);
    } catch (error) {
      this.logger.error(
        `Error processing checkout completion: ${error.message}`,
      );
      throw error;
    }
  }

  private async handleCheckoutSessionExpired(
    session: Stripe.Checkout.Session,
  ) {
    const orderId = session.metadata?.orderId;

    if (!orderId) {
      this.logger.error('No orderId in session metadata');
      return;
    }

    this.logger.log(`Checkout session expired for order: ${orderId}`);

    try {
      // Update order to CANCELLED
      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'CANCELLED',
        },
      });

      // Get order items and release seats
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: { orderItems: true },
      });

      if (order) {
        const ticketInventoryIds = order.orderItems.map(
          (item) => item.ticketInventoryId,
        );

        await this.prisma.ticketInventory.updateMany({
          where: {
            id: { in: ticketInventoryIds },
          },
          data: {
            status: 'AVAILABLE',
            holdExpiresAt: null,
          },
        });
      }

      // Clean up Redis
      await this.redis.del(`payment:session:${session.id}`);

      this.logger.log(`Order ${orderId} marked as CANCELLED (session expired)`);
    } catch (error) {
      this.logger.error(`Error handling expired session: ${error.message}`);
    }
  }

  handlePayment() {
    return {
      message: 'Webhook endpoint - Coming soon',
    };
  }
}
