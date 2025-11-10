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
    try {
      // Try to get from cache
      const cached = await this.redis.get<any[]>(this.EVENTS_CACHE_KEY);
      if (cached) {
        console.log('✅ Cache hit: events:all');
        return {
          data: cached,
          cached: true,
        };
      }
    } catch (error) {
      console.warn('⚠️  Redis cache read failed, falling back to database:', error.message);
    }

    // Cache miss or error - fetch from database
    console.log('Fetching events from database...');
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

    console.log(`Found ${events.length} events`);

    // Try to cache the result
    try {
      await this.redis.set(this.EVENTS_CACHE_KEY, events, this.CACHE_TTL);
      console.log('✅ Cached events:all for 300s');
    } catch (error) {
      console.warn('⚠️  Redis cache write failed:', error.message);
    }

    return {
      data: events,
      cached: false,
    };
  }

  async findOne(id: string) {
    const cacheKey = `${this.EVENT_CACHE_PREFIX}${id}`;

    try {
      // Try to get from cache
      const cached = await this.redis.get<any>(cacheKey);
      if (cached) {
        console.log(`✅ Cache hit: ${cacheKey}`);
        return {
          data: cached,
          cached: true,
        };
      }
    } catch (error) {
      console.warn(`⚠️  Redis cache read failed for ${cacheKey}:`, error.message);
    }

    // Cache miss or error - fetch from database
    console.log(`Fetching event ${id} from database...`);
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        stadium: true,
      },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    // Try to cache the result
    try {
      await this.redis.set(cacheKey, event, this.CACHE_TTL);
      console.log(`✅ Cached ${cacheKey} for 300s`);
    } catch (error) {
      console.warn(`⚠️  Redis cache write failed for ${cacheKey}:`, error.message);
    }

    return {
      data: event,
      cached: false,
    };
  }

  async getSeatsForEvent(eventId: string) {
    const cacheKey = `${this.SEATS_CACHE_PREFIX}${eventId}`;

    try {
      // Try to get from cache
      const cached = await this.redis.get<any>(cacheKey);
      if (cached) {
        console.log(`✅ Cache hit: ${cacheKey}`);
        return {
          data: cached,
          cached: true,
        };
      }
    } catch (error) {
      console.warn(`⚠️  Redis cache read failed for ${cacheKey}:`, error.message);
    }

    // Cache miss or error - fetch from database
    console.log(`Fetching seats for event ${eventId} from database...`);

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

    const seats = inventory.map((item) => ({
      id: item.id,
      seatId: item.seatId,
      section: item.seat.section,
      row: item.seat.row,
      number: item.seat.number,
      x: item.seat.x,
      y: item.seat.y,
      price: item.price.toString(),
      status: item.status,
    }));

    const result = {
      eventId,
      seats,
      totalSeats: seats.length,
      availableSeats: seats.filter((s) => s.status === 'AVAILABLE').length,
    };

    console.log(`Found ${seats.length} seats for event ${eventId}`);

    // Try to cache the result (shorter TTL for frequently changing data)
    try {
      await this.redis.set(cacheKey, result, 60); // 1 minute for seats
      console.log(`✅ Cached ${cacheKey} for 60s`);
    } catch (error) {
      console.warn(`⚠️  Redis cache write failed for ${cacheKey}:`, error.message);
    }

    return {
      data: result,
      cached: false,
    };
  }

  /**
   * Invalidate cached seats data for an event
   * Should be called when seat status changes (hold, release, purchase)
   */
  async invalidateSeatsCache(eventId: string): Promise<void> {
    const cacheKey = `${this.SEATS_CACHE_PREFIX}${eventId}`;
    try {
      await this.redis.del(cacheKey);
      console.log(`🗑️  Invalidated cache: ${cacheKey}`);
    } catch (error) {
      console.warn(`⚠️  Cache invalidation failed for ${cacheKey}:`, error.message);
    }
  }
}
