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
    // Skip Redis entirely for now to fix timeout issues
    console.log('Fetching events from database...');
    
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

    console.log(`Found ${events.length} events`);
    return {
      data: events,
      cached: false,
    };
  }

  async findOne(id: string) {
    console.log(`Fetching event ${id} from database...`);
    
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

    return {
      data: event,
      cached: false,
    };
  }

  async getSeatsForEvent(eventId: string) {
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

    // Skip Redis checks for now - just return the database status
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
    return {
      data: result,
      cached: false,
    };
  }
}
