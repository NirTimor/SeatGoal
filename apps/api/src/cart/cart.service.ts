import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

interface HoldSeatsDto {
  eventId: string;
  seatIds: string[];
  userId: string;
  sessionId: string;
}

@Injectable()
export class CartService {
  private readonly HOLD_DURATION = 600; // 10 minutes in seconds

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async holdSeats(dto: HoldSeatsDto) {
    const { eventId, seatIds, userId, sessionId } = dto;

    // Validate input
    if (!eventId || !seatIds || seatIds.length === 0) {
      throw new BadRequestException('Event ID and seat IDs are required');
    }

    if (seatIds.length > 10) {
      throw new BadRequestException('Cannot hold more than 10 seats at once');
    }

    // Verify event exists and is on sale
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    if (event.status !== 'ON_SALE') {
      throw new BadRequestException('Event is not available for purchase');
    }

    // Check if sale period is valid
    const now = new Date();
    if (now < event.saleStartDate || now > event.saleEndDate) {
      throw new BadRequestException('Event is not currently on sale');
    }

    // Fetch ticket inventory for requested seats
    const inventory = await this.prisma.ticketInventory.findMany({
      where: {
        eventId,
        seatId: { in: seatIds },
      },
      include: {
        seat: true,
      },
    });

    if (inventory.length !== seatIds.length) {
      throw new NotFoundException('Some seats not found for this event');
    }

    // Check if any seats are already sold
    const soldSeats = inventory.filter((item) => item.status === 'SOLD');
    if (soldSeats.length > 0) {
      throw new ConflictException(
        `Some seats are already sold: ${soldSeats.map((s) => `${s.seat.section}-${s.seat.row}-${s.seat.number}`).join(', ')}`,
      );
    }

    // Try to hold seats in Redis (atomic operation)
    const holdResult = await this.redis.holdSeats(
      eventId,
      seatIds,
      sessionId,
      this.HOLD_DURATION,
    );

    if (!holdResult.success) {
      throw new ConflictException(
        `Failed to hold seats. Already held: ${holdResult.failedSeats.join(', ')}`,
      );
    }

    // Update database status to HELD
    const expiresAt = new Date(Date.now() + this.HOLD_DURATION * 1000);
    await this.prisma.ticketInventory.updateMany({
      where: {
        eventId,
        seatId: { in: seatIds },
      },
      data: {
        status: 'HELD',
        holdExpiresAt: expiresAt,
      },
    });

    // Calculate total price
    const totalPrice = inventory.reduce(
      (sum, item) => sum + Number(item.price),
      0,
    );

    return {
      success: true,
      holdId: sessionId,
      expiresAt: expiresAt.toISOString(),
      expiresIn: this.HOLD_DURATION,
      seats: inventory.map((item) => ({
        inventoryId: item.id,
        seatId: item.seatId,
        section: item.seat.section,
        row: item.seat.row,
        number: item.seat.number,
        price: item.price.toString(),
      })),
      totalPrice: totalPrice.toString(),
      currency: 'ILS',
    };
  }

  async releaseHold(eventId: string, sessionId: string) {
    // Get held seats for this session
    const seatIds = await this.redis.getHeldSeats(eventId, sessionId);

    if (seatIds.length === 0) {
      return {
        success: true,
        message: 'No seats held for this session',
      };
    }

    // Release from Redis
    await this.redis.releaseSeats(eventId, seatIds, sessionId);

    // Update database
    await this.prisma.ticketInventory.updateMany({
      where: {
        eventId,
        seatId: { in: seatIds },
        status: 'HELD',
      },
      data: {
        status: 'AVAILABLE',
        holdExpiresAt: null,
      },
    });

    return {
      success: true,
      releasedSeats: seatIds.length,
    };
  }

  async extendHold(eventId: string, sessionId: string) {
    const seatIds = await this.redis.getHeldSeats(eventId, sessionId);

    if (seatIds.length === 0) {
      throw new NotFoundException('No active hold found for this session');
    }

    // Extend hold in Redis
    const extended = await this.redis.extendHold(
      eventId,
      seatIds[0], // Use first seat to check
      sessionId,
      this.HOLD_DURATION,
    );

    if (!extended) {
      throw new BadRequestException('Failed to extend hold');
    }

    // Extend all seats
    for (const seatId of seatIds) {
      await this.redis.extendHold(
        eventId,
        seatId,
        sessionId,
        this.HOLD_DURATION,
      );
    }

    // Update database
    const newExpiresAt = new Date(Date.now() + this.HOLD_DURATION * 1000);
    await this.prisma.ticketInventory.updateMany({
      where: {
        eventId,
        seatId: { in: seatIds },
        status: 'HELD',
      },
      data: {
        holdExpiresAt: newExpiresAt,
      },
    });

    return {
      success: true,
      expiresAt: newExpiresAt.toISOString(),
      expiresIn: this.HOLD_DURATION,
    };
  }
}
