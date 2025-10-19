import { Controller, Get, Param } from '@nestjs/common';
import { EventsService } from './events.service';
import { Public } from '../auth/public.decorator';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Public()
  @Get()
  async findAll() {
    return this.eventsService.findAll();
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @Public()
  @Get(':id/seats')
  async getSeats(@Param('id') id: string) {
    return this.eventsService.getSeatsForEvent(id);
  }
}
