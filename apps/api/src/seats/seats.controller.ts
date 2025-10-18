import { Controller, Get } from '@nestjs/common';
import { SeatsService } from './seats.service';
import { Public } from '../auth/public.decorator';

@Controller('seats')
export class SeatsController {
  constructor(private readonly seatsService: SeatsService) {}

  @Public()
  @Get()
  findAll() {
    return this.seatsService.findAll();
  }
}

