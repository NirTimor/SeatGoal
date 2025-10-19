import { Injectable } from '@nestjs/common';

@Injectable()
export class SeatsService {
  findAll() {
    return {
      message: 'Seats endpoint - Coming soon',
      data: [],
    };
  }
}
