import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class EventsService {
  private readonly EVENTS_CACHE_KEY = 'events:all';
  private readonly EVENT_CACHE_PREFIX = 'event:';
  private readonly SEATS_CACHE_PREFIX = 'event:seats:';
  private readonly CACHE_TTL = 300; // 5 minutes

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async findAll() {
    // Try cache first
    const cached = await this.redis.get(this.EVENTS_CACHE_KEY);
    if (cached) {
      return {
        data: cached,
        cached: true,
      };
    }

    // Fetch from database
    const events = await this.prisma.event.findMany({
      where: {
        status: {
          in: ['UPCOMING', 'ON_SALE'],
        },
      },
      include: {
        stadium: true,
      },
      orderBy: {
        eventDate: 'asc',
      },
    });

    // Cache the result
    await this.redis.set(this.EVENTS_CACHE_KEY, events, this.CACHE_TTL);

    return {
      data: events,
      cached: false,
    };
  }

  async findOne(id: string) {
    const cacheKey = `${this.EVENT_CACHE_PREFIX}${id}`;
    
    // Try cache first
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return {
        data: cached,
        cached: true,
      };
    }

    // Fetch from database
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        stadium: true,
      },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    // Cache the result
    await this.redis.set(cacheKey, event, this.CACHE_TTL);

    return {
      data: event,
      cached: false,
    };
  }

  async getSeatsForEvent(eventId: string) {
    const cacheKey = `${this.SEATS_CACHE_PREFIX}${eventId}`;
    
    // Try cache first
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return {
        data: cached,
        cached: true,
      };
    }

    // Verify event exists
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    // Fetch seats with inventory
    const inventory = await this.prisma.ticketInventory.findMany({
      where: { eventId },
      include: {
        seat: true,
      },
      orderBy: [
        { seat: { section: 'asc' } },
        { seat: { row: 'asc' } },
        { seat: { number: 'asc' } },
      ],
    });

    // Check Redis for holds and update status accordingly
    const seatsWithRealTimeStatus = await Promise.all(
      inventory.map(async (item) => {
        let status = item.status;
        
        // If status is HELD, check if it's still held in Redis
        if (status === 'HELD') {
          const isHeld = await this.redis.isSeatHeld(eventId, item.seatId);
          if (!isHeld) {
            // Hold expired, update to AVAILABLE
            status = 'AVAILABLE';
          }
        }

        return {
          id: item.id,
          seatId: item.seatId,
          section: item.seat.section,
          row: item.seat.row,
          number: item.seat.number,
          x: item.seat.x,
          y: item.seat.y,
          price: item.price.toString(),
          status,
        };
      }),
    );

    const result = {
      eventId,
      seats: seatsWithRealTimeStatus,
      totalSeats: seatsWithRealTimeStatus.length,
      availableSeats: seatsWithRealTimeStatus.filter(s => s.status === 'AVAILABLE').length,
    };

    // Cache the result (short TTL since seat availability changes frequently)
    await this.redis.set(cacheKey, result, 60); // 1 minute TTL

    return {
      data: result,
      cached: false,
    };
  }
}

