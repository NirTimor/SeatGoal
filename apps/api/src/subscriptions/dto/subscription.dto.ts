import { SubscriptionStatus } from '@prisma/client';

export class SubscriptionDto {
  id: string;
  userProfileId: string;
  team: string;
  teamHe: string;
  season: string;
  startDate: Date;
  endDate: Date;
  status: SubscriptionStatus;
  price: number;
  seatInfo?: any;
  autoRenew: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class CreateSubscriptionDto {
  team: string;
  teamHe: string;
  season: string;
  startDate: Date;
  endDate: Date;
  price: number;
  seatInfo?: any;
  autoRenew?: boolean;
}

export class UpdateSubscriptionDto {
  autoRenew?: boolean;
  status?: SubscriptionStatus;
}

export class SubscriptionListResponseDto {
  active: SubscriptionDto[];
  expired: SubscriptionDto[];
  total: number;
}

export class RenewSubscriptionDto {
  subscriptionId: string;
  newSeason: string;
  newStartDate: Date;
  newEndDate: Date;
  newPrice: number;
}
