import { Injectable } from '@nestjs/common';

@Injectable()
export class EventsService {
  findAll() {
    return {
      message: 'Events endpoint - Coming soon',
      data: [],
    };
  }
}

