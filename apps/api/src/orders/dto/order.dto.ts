import { OrderStatus } from '@prisma/client';

export class OrderDto {
  id: string;
  userId: string;
  eventId: string;
  totalAmount: number;
  currency: string;
  status: OrderStatus;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  createdAt: Date;
  updatedAt: Date;
  event?: any;
  orderItems?: any[];
}

export class OrderFilterDto {
  status?: OrderStatus;
  eventId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  pageSize?: number;
}

export class OrderHistoryResponseDto {
  orders: OrderDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export class OrderDetailsDto {
  id: string;
  userId: string;
  eventId: string;
  totalAmount: number;
  currency: string;
  status: OrderStatus;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  createdAt: Date;
  updatedAt: Date;
  event: {
    id: string;
    homeTeam: string;
    homeTeamHe: string;
    awayTeam: string;
    awayTeamHe: string;
    eventDate: Date;
    stadium: {
      name: string;
      nameHe: string;
      city: string;
      cityHe: string;
    };
  };
  orderItems: {
    id: string;
    price: number;
    attended: boolean;
    attendedAt?: Date;
    seat: {
      section: string;
      row: string;
      number: string;
    };
    transfer?: any;
  }[];
}

export class OrderStatsDto {
  totalOrders: number;
  totalSpent: number;
  paidOrders: number;
  cancelledOrders: number;
  refundedOrders: number;
  totalTickets: number;
  upcomingEvents: number;
  pastEvents: number;
}
