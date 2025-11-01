import { LoyaltyPointType } from '@prisma/client';

export class LoyaltyPointDto {
  id: string;
  userProfileId: string;
  points: number;
  type: LoyaltyPointType;
  reason: string;
  orderId?: string;
  orderItemId?: string;
  eventId?: string;
  expiresAt?: Date;
  createdAt: Date;
}

export class CreateLoyaltyPointDto {
  points: number;
  type: LoyaltyPointType;
  reason: string;
  orderId?: string;
  orderItemId?: string;
  eventId?: string;
  expiresAt?: Date;
}

export class LoyaltyPointsBalanceDto {
  totalPoints: number;
  activePoints: number;
  expiredPoints: number;
  redeemedPoints: number;
  expiringWithin30Days: number;
}

export class LoyaltyPointsHistoryDto {
  transactions: LoyaltyPointDto[];
  balance: LoyaltyPointsBalanceDto;
  total: number;
  page: number;
  pageSize: number;
}

export class RedeemPointsDto {
  points: number;
  reason: string;
  orderId?: string;
}

export class MarkAttendanceDto {
  orderItemId: string;
}

export class PointsCalculation {
  awayGamePoints: number;
  homeGameAttendancePoints: number;
  subscriptionBonusPoints: number;
  totalEarned: number;
}
