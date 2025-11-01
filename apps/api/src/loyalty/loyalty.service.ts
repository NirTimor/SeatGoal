import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LoyaltyPointType } from '@prisma/client';
import {
  CreateLoyaltyPointDto,
  LoyaltyPointsBalanceDto,
  LoyaltyPointsHistoryDto,
  RedeemPointsDto,
  MarkAttendanceDto,
  PointsCalculation,
} from './dto/loyalty.dto';

@Injectable()
export class LoyaltyService {
  // Point values configuration
  private readonly POINTS_CONFIG = {
    AWAY_GAME_PURCHASE: 50,
    HOME_GAME_ATTENDANCE: 30,
    SUBSCRIPTION_BONUS: 200,
    REFERRAL: 100,
    POINTS_EXPIRY_DAYS: 365, // Points expire after 1 year
  };

  constructor(private prisma: PrismaService) {}

  async getBalance(clerkUserId: string): Promise<LoyaltyPointsBalanceDto> {
    const profile = await this.getProfile(clerkUserId);

    const points = await this.prisma.loyaltyPoint.findMany({
      where: { userProfileId: profile.id },
    });

    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    let activePoints = 0;
    let expiredPoints = 0;
    let redeemedPoints = 0;
    let expiringWithin30Days = 0;

    points.forEach((point) => {
      if (point.type === LoyaltyPointType.EXPIRED) {
        expiredPoints += Math.abs(point.points);
      } else if (point.type === LoyaltyPointType.REDEEMED) {
        redeemedPoints += Math.abs(point.points);
      } else if (
        !point.expiresAt ||
        point.expiresAt > now
      ) {
        activePoints += point.points;

        if (
          point.expiresAt &&
          point.expiresAt <= thirtyDaysFromNow &&
          point.expiresAt > now
        ) {
          expiringWithin30Days += point.points;
        }
      } else {
        expiredPoints += point.points;
      }
    });

    return {
      totalPoints: activePoints,
      activePoints,
      expiredPoints,
      redeemedPoints,
      expiringWithin30Days,
    };
  }

  async getHistory(
    clerkUserId: string,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<LoyaltyPointsHistoryDto> {
    const profile = await this.getProfile(clerkUserId);

    const [transactions, total, balance] = await Promise.all([
      this.prisma.loyaltyPoint.findMany({
        where: { userProfileId: profile.id },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.loyaltyPoint.count({
        where: { userProfileId: profile.id },
      }),
      this.getBalance(clerkUserId),
    ]);

    return {
      transactions,
      balance,
      total,
      page,
      pageSize,
    };
  }

  async awardPoints(
    clerkUserId: string,
    createDto: CreateLoyaltyPointDto,
  ) {
    const profile = await this.getProfile(clerkUserId);

    const point = await this.prisma.loyaltyPoint.create({
      data: {
        userProfileId: profile.id,
        ...createDto,
      },
    });

    return point;
  }

  async redeemPoints(clerkUserId: string, redeemDto: RedeemPointsDto) {
    const profile = await this.getProfile(clerkUserId);
    const balance = await this.getBalance(clerkUserId);

    if (balance.activePoints < redeemDto.points) {
      throw new BadRequestException('Insufficient points balance');
    }

    const point = await this.prisma.loyaltyPoint.create({
      data: {
        userProfileId: profile.id,
        points: -redeemDto.points,
        type: LoyaltyPointType.REDEEMED,
        reason: redeemDto.reason,
        orderId: redeemDto.orderId,
      },
    });

    return point;
  }

  async markAttendance(
    clerkUserId: string,
    attendanceDto: MarkAttendanceDto,
  ) {
    const profile = await this.getProfile(clerkUserId);

    // Find the order item
    const orderItem = await this.prisma.orderItem.findFirst({
      where: {
        id: attendanceDto.orderItemId,
        order: {
          userId: profile.clerkUserId,
        },
      },
      include: {
        ticketInventory: {
          include: {
            event: true,
          },
        },
      },
    });

    if (!orderItem) {
      throw new NotFoundException('Order item not found');
    }

    if (orderItem.attended) {
      throw new BadRequestException('Attendance already marked');
    }

    // Check if event has already occurred
    const event = orderItem.ticketInventory.event;
    if (event.eventDate > new Date()) {
      throw new BadRequestException('Event has not occurred yet');
    }

    // Mark attendance
    await this.prisma.orderItem.update({
      where: { id: attendanceDto.orderItemId },
      data: {
        attended: true,
        attendedAt: new Date(),
      },
    });

    // Check if it's a home game (you'll need to determine this based on your logic)
    const isHomeGame = event.homeTeam; // Adjust this logic based on your needs

    if (isHomeGame) {
      // Award loyalty points
      const expiresAt = new Date();
      expiresAt.setDate(
        expiresAt.getDate() + this.POINTS_CONFIG.POINTS_EXPIRY_DAYS,
      );

      await this.prisma.loyaltyPoint.create({
        data: {
          userProfileId: profile.id,
          points: this.POINTS_CONFIG.HOME_GAME_ATTENDANCE,
          type: LoyaltyPointType.HOME_GAME_ATTENDANCE,
          reason: `Attended home game: ${event.homeTeam} vs ${event.awayTeam}`,
          orderItemId: orderItem.id,
          eventId: event.id,
          expiresAt,
        },
      });
    }

    return {
      attended: true,
      pointsAwarded: isHomeGame ? this.POINTS_CONFIG.HOME_GAME_ATTENDANCE : 0,
    };
  }

  async processAwayGamePurchase(
    clerkUserId: string,
    orderId: string,
    eventId: string,
    eventDescription: string,
  ) {
    const profile = await this.getProfile(clerkUserId);

    const expiresAt = new Date();
    expiresAt.setDate(
      expiresAt.getDate() + this.POINTS_CONFIG.POINTS_EXPIRY_DAYS,
    );

    const point = await this.prisma.loyaltyPoint.create({
      data: {
        userProfileId: profile.id,
        points: this.POINTS_CONFIG.AWAY_GAME_PURCHASE,
        type: LoyaltyPointType.AWAY_GAME_PURCHASE,
        reason: `Purchased ticket for away game: ${eventDescription}`,
        orderId,
        eventId,
        expiresAt,
      },
    });

    return point;
  }

  async processSubscriptionBonus(
    clerkUserId: string,
    subscriptionId: string,
    teamName: string,
  ) {
    const profile = await this.getProfile(clerkUserId);

    const expiresAt = new Date();
    expiresAt.setDate(
      expiresAt.getDate() + this.POINTS_CONFIG.POINTS_EXPIRY_DAYS,
    );

    const point = await this.prisma.loyaltyPoint.create({
      data: {
        userProfileId: profile.id,
        points: this.POINTS_CONFIG.SUBSCRIPTION_BONUS,
        type: LoyaltyPointType.SUBSCRIPTION_BONUS,
        reason: `Season subscription bonus for ${teamName}`,
        expiresAt,
      },
    });

    return point;
  }

  async getPointsCalculation(clerkUserId: string): Promise<PointsCalculation> {
    const profile = await this.getProfile(clerkUserId);

    const points = await this.prisma.loyaltyPoint.findMany({
      where: { userProfileId: profile.id },
    });

    let awayGamePoints = 0;
    let homeGameAttendancePoints = 0;
    let subscriptionBonusPoints = 0;

    points.forEach((point) => {
      if (point.type === LoyaltyPointType.AWAY_GAME_PURCHASE) {
        awayGamePoints += point.points;
      } else if (point.type === LoyaltyPointType.HOME_GAME_ATTENDANCE) {
        homeGameAttendancePoints += point.points;
      } else if (point.type === LoyaltyPointType.SUBSCRIPTION_BONUS) {
        subscriptionBonusPoints += point.points;
      }
    });

    return {
      awayGamePoints,
      homeGameAttendancePoints,
      subscriptionBonusPoints,
      totalEarned: awayGamePoints + homeGameAttendancePoints + subscriptionBonusPoints,
    };
  }

  async expirePoints() {
    const now = new Date();

    // Find all points that should be expired
    const expiredPoints = await this.prisma.loyaltyPoint.findMany({
      where: {
        expiresAt: {
          lte: now,
        },
        type: {
          notIn: [LoyaltyPointType.EXPIRED, LoyaltyPointType.REDEEMED],
        },
      },
    });

    // Create expiration records
    for (const point of expiredPoints) {
      await this.prisma.loyaltyPoint.create({
        data: {
          userProfileId: point.userProfileId,
          points: -point.points,
          type: LoyaltyPointType.EXPIRED,
          reason: `Points expired from ${point.reason}`,
          orderId: point.orderId,
          orderItemId: point.orderItemId,
          eventId: point.eventId,
        },
      });
    }

    return { expiredCount: expiredPoints.length };
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
}
