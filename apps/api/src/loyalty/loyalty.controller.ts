import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { LoyaltyService } from './loyalty.service';
import { RedeemPointsDto, MarkAttendanceDto } from './dto/loyalty.dto';

@Controller('loyalty')
@UseGuards(AuthGuard)
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Get('balance')
  async getBalance(@Request() req) {
    return this.loyaltyService.getBalance(req.user.userId);
  }

  @Get('history')
  async getHistory(
    @Request() req,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.loyaltyService.getHistory(
      req.user.userId,
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 20,
    );
  }

  @Get('calculation')
  async getPointsCalculation(@Request() req) {
    return this.loyaltyService.getPointsCalculation(req.user.userId);
  }

  @Post('redeem')
  async redeemPoints(@Request() req, @Body() redeemDto: RedeemPointsDto) {
    return this.loyaltyService.redeemPoints(req.user.userId, redeemDto);
  }

  @Post('attendance')
  async markAttendance(
    @Request() req,
    @Body() attendanceDto: MarkAttendanceDto,
  ) {
    return this.loyaltyService.markAttendance(req.user.userId, attendanceDto);
  }
}
