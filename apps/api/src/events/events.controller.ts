import { Controller, Get, Param, UseInterceptors } from '@nestjs/common';
import { EventsService } from './events.service';
import { Public } from '../auth/public.decorator';
import { ETagInterceptor } from '../common/interceptors/etag.interceptor';
import { CacheControlInterceptor } from '../common/interceptors/cache-control.interceptor';
import { CacheTTL } from '../common/decorators/cache-ttl.decorator';

@Controller('events')
@UseInterceptors(ETagInterceptor, CacheControlInterceptor)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Public()
  @Get()
  @CacheTTL(300) // Cache for 5 minutes
  async findAll() {
    return this.eventsService.findAll();
  }

  @Public()
  @Get(':id')
  @CacheTTL(300) // Cache for 5 minutes
  async findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @Public()
  @Get(':id/seats')
  @CacheTTL(60) // Cache for 1 minute (frequently changing)
  async getSeats(@Param('id') id: string) {
    return this.eventsService.getSeatsForEvent(id);
  }
}
