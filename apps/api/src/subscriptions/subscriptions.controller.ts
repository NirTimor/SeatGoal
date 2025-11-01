import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { SubscriptionsService } from './subscriptions.service';
import {
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
  RenewSubscriptionDto,
} from './dto/subscription.dto';

@Controller('subscriptions')
@UseGuards(AuthGuard)
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get()
  async getAllSubscriptions(@Request() req) {
    return this.subscriptionsService.getAllSubscriptions(req.user.userId);
  }

  @Get('active')
  async getActiveSubscriptions(@Request() req) {
    return this.subscriptionsService.getActiveSubscriptions(req.user.userId);
  }

  @Get('expired')
  async getExpiredSubscriptions(@Request() req) {
    return this.subscriptionsService.getExpiredSubscriptions(req.user.userId);
  }

  @Post()
  async createSubscription(
    @Request() req,
    @Body() createDto: CreateSubscriptionDto,
  ) {
    return this.subscriptionsService.createSubscription(
      req.user.userId,
      createDto,
    );
  }

  @Put(':id')
  async updateSubscription(
    @Request() req,
    @Param('id') id: string,
    @Body() updateDto: UpdateSubscriptionDto,
  ) {
    return this.subscriptionsService.updateSubscription(
      req.user.userId,
      id,
      updateDto,
    );
  }

  @Delete(':id')
  async cancelSubscription(@Request() req, @Param('id') id: string) {
    return this.subscriptionsService.cancelSubscription(req.user.userId, id);
  }

  @Post('renew')
  async renewSubscription(
    @Request() req,
    @Body() renewDto: RenewSubscriptionDto,
  ) {
    return this.subscriptionsService.renewSubscription(
      req.user.userId,
      renewDto,
    );
  }
}
