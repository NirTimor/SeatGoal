import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { StripeService } from '../stripe/stripe.service';

interface CreateCheckoutSessionDto {
  eventId: string;
  sessionId: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
}

@Injectable()
export class CheckoutService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private stripe: StripeService,
    private config: ConfigService,
  ) {}

  async createSession(dto: CreateCheckoutSessionDto) {
    const { eventId, sessionId, userId, email, firstName, lastName, phone } =
      dto;

    // Validate input
    if (!eventId || !sessionId || !email || !firstName || !lastName) {
      throw new BadRequestException('Missing required fields');
    }

    // Get all seats held by this session
    const heldSeatIds = await this.redis.getHeldSeats(eventId, sessionId);

    if (heldSeatIds.length === 0) {
      throw new BadRequestException('No seats are held for this session');
    }

    // Verify event exists
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: { stadium: true },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Get ticket inventory for held seats
    const ticketInventory = await this.prisma.ticketInventory.findMany({
      where: {
        eventId,
        seatId: { in: heldSeatIds },
        status: 'HELD',
      },
      include: {
        seat: true,
      },
    });

    if (ticketInventory.length === 0) {
      throw new BadRequestException('No valid held seats found');
    }

    if (ticketInventory.length !== heldSeatIds.length) {
      throw new BadRequestException('Some held seats are no longer available');
    }

    // Calculate total amount
    const totalAmount = ticketInventory.reduce(
      (sum, item) => sum + Number(item.price),
      0,
    );

    // Create order in PENDING status
    const order = await this.prisma.order.create({
      data: {
        userId,
        eventId,
        totalAmount,
        currency: 'ILS',
        status: 'PENDING',
        email,
        firstName,
        lastName,
        phone,
        orderItems: {
          create: ticketInventory.map((item) => ({
            ticketInventoryId: item.id,
            price: item.price,
          })),
        },
      },
      include: {
        event: {
          include: {
            stadium: true,
          },
        },
        orderItems: {
          include: {
            ticketInventory: {
              include: {
                seat: true,
              },
            },
          },
        },
      },
    });

    const frontendUrl = this.config.get<string>('FRONTEND_URL') || 'http://localhost:3000';

    // Try to use Stripe if configured, otherwise fallback to simulation
    let checkoutUrl: string;
    let paymentSessionId: string;

    if (this.stripe.isConfigured()) {
      // Use Stripe for payment processing
      const seatDetails = ticketInventory
        .map((item) => `${item.seat.section}-${item.seat.row}-${item.seat.number}`)
        .join(', ');

      const eventName = `${event.homeTeam} vs ${event.awayTeam} - ${event.stadium.name}`;

      try {
        const stripeSession = await this.stripe.createCheckoutSession({
          orderId: order.id,
          amount: Math.round(totalAmount * 100), // Convert ILS to agorot
          currency: 'ILS',
          customerEmail: email,
          eventName,
          seatDetails: `Seats: ${seatDetails}`,
          successUrl: `${frontendUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}`,
          cancelUrl: `${frontendUrl}/checkout/cancel?order_id=${order.id}`,
        });

        checkoutUrl = stripeSession.url;
        paymentSessionId = stripeSession.id;

        // Store session mapping in Redis (30 minutes)
        await this.redis.set(
          `payment:session:${stripeSession.id}`,
          {
            orderId: order.id,
            sessionId,
            eventId,
            userId,
            totalAmount: totalAmount.toString(),
          },
          1800, // 30 minutes
        );
      } catch (error) {
        throw new BadRequestException(`Failed to create Stripe session: ${error.message}`);
      }
    } else {
      // Fallback to simulation mode
      paymentSessionId = `sim_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      // Store payment session info in Redis (5 minutes)
      await this.redis.set(
        `payment:session:${paymentSessionId}`,
        {
          orderId: order.id,
          sessionId,
          eventId,
          userId,
          totalAmount: totalAmount.toString(),
        },
        300, // 5 minutes
      );

      // Mock checkout URL for testing
      checkoutUrl = `${frontendUrl}/checkout/payment?session=${paymentSessionId}&order=${order.id}`;
    }

    return {
      success: true,
      orderId: order.id,
      sessionId: paymentSessionId,
      checkoutUrl,
      order: {
        id: order.id,
        totalAmount: order.totalAmount.toString(),
        currency: order.currency,
        event: {
          id: order.event.id,
          homeTeam: order.event.homeTeam,
          awayTeam: order.event.awayTeam,
          eventDate: order.event.eventDate.toISOString(),
          stadium: {
            name: order.event.stadium.name,
            city: order.event.stadium.city,
          },
        },
        items: order.orderItems.map((item) => ({
          section: item.ticketInventory.seat.section,
          row: item.ticketInventory.seat.row,
          number: item.ticketInventory.seat.number,
          price: item.price.toString(),
        })),
      },
    };
  }

  async getOrderStatus(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        event: {
          include: {
            stadium: true,
          },
        },
        orderItems: {
          include: {
            ticketInventory: {
              include: {
                seat: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return {
      id: order.id,
      status: order.status,
      totalAmount: order.totalAmount.toString(),
      currency: order.currency,
      createdAt: order.createdAt.toISOString(),
      event: {
        id: order.event.id,
        homeTeam: order.event.homeTeam,
        homeTeamHe: order.event.homeTeamHe,
        awayTeam: order.event.awayTeam,
        awayTeamHe: order.event.awayTeamHe,
        eventDate: order.event.eventDate.toISOString(),
        stadium: {
          name: order.event.stadium.name,
          nameHe: order.event.stadium.nameHe,
          city: order.event.stadium.city,
          cityHe: order.event.stadium.cityHe,
        },
      },
      items: order.orderItems.map((item) => ({
        section: item.ticketInventory.seat.section,
        row: item.ticketInventory.seat.row,
        number: item.ticketInventory.seat.number,
        price: item.price.toString(),
      })),
      customer: {
        email: order.email,
        firstName: order.firstName,
        lastName: order.lastName,
        phone: order.phone,
      },
    };
  }

  async simulatePayment(paymentSessionId: string, success: boolean = true) {
    // Get payment session from Redis
    const session = await this.redis.get<{
      orderId: string;
      sessionId: string;
      eventId: string;
      userId: string;
      totalAmount: string;
    }>(`payment:session:${paymentSessionId}`);

    if (!session) {
      throw new NotFoundException('Payment session not found or expired');
    }

    const { orderId, sessionId, eventId } = session;

    if (success) {
      // Update order to PAID
      const order = await this.prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'PAID',
          paymentIntentId: paymentSessionId,
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

      // Release Redis holds
      const heldSeats = await this.redis.getHeldSeats(eventId, sessionId);
      if (heldSeats.length > 0) {
        await this.redis.releaseSeats(eventId, heldSeats, sessionId);
      }

      // Delete payment session
      await this.redis.del(`payment:session:${paymentSessionId}`);

      return {
        success: true,
        orderId,
        status: 'PAID',
        message: 'Payment successful',
      };
    } else {
      // Payment failed - update order to CANCELLED
      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'CANCELLED',
        },
      });

      // Release seats back to AVAILABLE
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

      // Release Redis holds
      const heldSeats = await this.redis.getHeldSeats(eventId, sessionId);
      if (heldSeats.length > 0) {
        await this.redis.releaseSeats(eventId, heldSeats, sessionId);
      }

      // Delete payment session
      await this.redis.del(`payment:session:${paymentSessionId}`);

      return {
        success: false,
        orderId,
        status: 'CANCELLED',
        message: 'Payment failed',
      };
    }
  }
}
