import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionStatus } from '@prisma/client';
import {
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
  SubscriptionListResponseDto,
  RenewSubscriptionDto,
} from './dto/subscription.dto';

@Injectable()
export class SubscriptionsService {
  constructor(private prisma: PrismaService) {}

  async getActiveSubscriptions(clerkUserId: string) {
    const profile = await this.getProfile(clerkUserId);

    return this.prisma.seasonSubscription.findMany({
      where: {
        userProfileId: profile.id,
        status: SubscriptionStatus.ACTIVE,
      },
      orderBy: {
        endDate: 'desc',
      },
    });
  }

  async getExpiredSubscriptions(clerkUserId: string) {
    const profile = await this.getProfile(clerkUserId);

    return this.prisma.seasonSubscription.findMany({
      where: {
        userProfileId: profile.id,
        status: {
          in: [SubscriptionStatus.EXPIRED, SubscriptionStatus.CANCELLED],
        },
      },
      orderBy: {
        endDate: 'desc',
      },
    });
  }

  async getAllSubscriptions(
    clerkUserId: string,
  ): Promise<SubscriptionListResponseDto> {
    const profile = await this.getProfile(clerkUserId);

    const [active, expired] = await Promise.all([
      this.prisma.seasonSubscription.findMany({
        where: {
          userProfileId: profile.id,
          status: SubscriptionStatus.ACTIVE,
        },
        orderBy: {
          endDate: 'desc',
        },
      }),
      this.prisma.seasonSubscription.findMany({
        where: {
          userProfileId: profile.id,
          status: {
            in: [SubscriptionStatus.EXPIRED, SubscriptionStatus.CANCELLED],
          },
        },
        orderBy: {
          endDate: 'desc',
        },
      }),
    ]);

    return {
      active: active.map(this.formatSubscription),
      expired: expired.map(this.formatSubscription),
      total: active.length + expired.length,
    };
  }

  async createSubscription(
    clerkUserId: string,
    createDto: CreateSubscriptionDto,
  ) {
    const profile = await this.getProfile(clerkUserId);

    // Check if user already has active subscription for this team/season
    const existing = await this.prisma.seasonSubscription.findFirst({
      where: {
        userProfileId: profile.id,
        team: createDto.team,
        season: createDto.season,
        status: SubscriptionStatus.ACTIVE,
      },
    });

    if (existing) {
      throw new BadRequestException(
        'Active subscription already exists for this team and season',
      );
    }

    const subscription = await this.prisma.seasonSubscription.create({
      data: {
        userProfileId: profile.id,
        ...createDto,
        autoRenew: createDto.autoRenew ?? true,
      },
    });

    return this.formatSubscription(subscription);
  }

  async updateSubscription(
    clerkUserId: string,
    subscriptionId: string,
    updateDto: UpdateSubscriptionDto,
  ) {
    const profile = await this.getProfile(clerkUserId);

    const subscription = await this.prisma.seasonSubscription.findFirst({
      where: {
        id: subscriptionId,
        userProfileId: profile.id,
      },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    const updated = await this.prisma.seasonSubscription.update({
      where: { id: subscriptionId },
      data: updateDto,
    });

    return this.formatSubscription(updated);
  }

  async cancelSubscription(clerkUserId: string, subscriptionId: string) {
    const profile = await this.getProfile(clerkUserId);

    const subscription = await this.prisma.seasonSubscription.findFirst({
      where: {
        id: subscriptionId,
        userProfileId: profile.id,
      },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    const updated = await this.prisma.seasonSubscription.update({
      where: { id: subscriptionId },
      data: {
        status: SubscriptionStatus.CANCELLED,
        autoRenew: false,
      },
    });

    return this.formatSubscription(updated);
  }

  async renewSubscription(
    clerkUserId: string,
    renewDto: RenewSubscriptionDto,
  ) {
    const profile = await this.getProfile(clerkUserId);

    const oldSubscription = await this.prisma.seasonSubscription.findFirst({
      where: {
        id: renewDto.subscriptionId,
        userProfileId: profile.id,
      },
    });

    if (!oldSubscription) {
      throw new NotFoundException('Subscription not found');
    }

    // Create new subscription
    const newSubscription = await this.prisma.seasonSubscription.create({
      data: {
        userProfileId: profile.id,
        team: oldSubscription.team,
        teamHe: oldSubscription.teamHe,
        season: renewDto.newSeason,
        startDate: renewDto.newStartDate,
        endDate: renewDto.newEndDate,
        price: renewDto.newPrice,
        seatInfo: oldSubscription.seatInfo,
        autoRenew: oldSubscription.autoRenew,
        status: SubscriptionStatus.ACTIVE,
      },
    });

    // Mark old subscription as expired
    await this.prisma.seasonSubscription.update({
      where: { id: renewDto.subscriptionId },
      data: { status: SubscriptionStatus.EXPIRED },
    });

    return this.formatSubscription(newSubscription);
  }

  private async getProfile(clerkUserId: string) {
    const profile = await this.prisma.userProfile.findUnique({
      where: { clerkUserId },
    });

    if (!profile) {
      throw new NotFoundException('User profile not found');
    }

    return profile;
  }

  private formatSubscription(subscription: any) {
    return {
      ...subscription,
      price: Number(subscription.price),
    };
  }
}
