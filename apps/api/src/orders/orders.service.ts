import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from '@prisma/client';
import {
  OrderFilterDto,
  OrderHistoryResponseDto,
  OrderDetailsDto,
  OrderStatsDto,
} from './dto/order.dto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async getOrderHistory(
    clerkUserId: string,
    filter: OrderFilterDto,
  ): Promise<OrderHistoryResponseDto> {
    const page = filter.page || 1;
    const pageSize = filter.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const where: any = {
      userId: clerkUserId,
    };

    if (filter.status) {
      where.status = filter.status;
    }

    if (filter.eventId) {
      where.eventId = filter.eventId;
    }

    if (filter.startDate || filter.endDate) {
      where.createdAt = {};
      if (filter.startDate) {
        where.createdAt.gte = filter.startDate;
      }
      if (filter.endDate) {
        where.createdAt.lte = filter.endDate;
      }
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          event: {
            include: {
              stadium: true,
            },
          },
          orderItems: {
            include: {
              ticketInventory: {
                include: {
                  seat: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      orders: orders.map(this.formatOrder),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getOrderById(
    clerkUserId: string,
    orderId: string,
  ): Promise<OrderDetailsDto> {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        userId: clerkUserId,
      },
      include: {
        event: {
          include: {
            stadium: true,
          },
        },
        orderItems: {
          include: {
            ticketInventory: {
              include: {
                seat: true,
              },
            },
            transfer: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.formatOrderDetails(order);
  }

  async getUpcomingOrders(clerkUserId: string) {
    const now = new Date();

    const orders = await this.prisma.order.findMany({
      where: {
        userId: clerkUserId,
        status: OrderStatus.PAID,
        event: {
          eventDate: {
            gte: now,
          },
        },
      },
      include: {
        event: {
          include: {
            stadium: true,
          },
        },
        orderItems: {
          include: {
            ticketInventory: {
              include: {
                seat: true,
              },
            },
          },
        },
      },
      orderBy: {
        event: {
          eventDate: 'asc',
        },
      },
    });

    return orders.map(this.formatOrder);
  }

  async getPastOrders(clerkUserId: string) {
    const now = new Date();

    const orders = await this.prisma.order.findMany({
      where: {
        userId: clerkUserId,
        status: OrderStatus.PAID,
        event: {
          eventDate: {
            lt: now,
          },
        },
      },
      include: {
        event: {
          include: {
            stadium: true,
          },
        },
        orderItems: {
          include: {
            ticketInventory: {
              include: {
                seat: true,
              },
            },
          },
        },
      },
      orderBy: {
        event: {
          eventDate: 'desc',
        },
      },
    });

    return orders.map(this.formatOrder);
  }

  async getOrderStats(clerkUserId: string): Promise<OrderStatsDto> {
    const orders = await this.prisma.order.findMany({
      where: { userId: clerkUserId },
      include: {
        orderItems: true,
        event: true,
      },
    });

    const now = new Date();

    let totalSpent = 0;
    let totalTickets = 0;
    let upcomingEvents = 0;
    let pastEvents = 0;

    const paidOrders = orders.filter((o) => o.status === OrderStatus.PAID);
    const cancelledOrders = orders.filter(
      (o) => o.status === OrderStatus.CANCELLED,
    );
    const refundedOrders = orders.filter(
      (o) => o.status === OrderStatus.REFUNDED,
    );

    paidOrders.forEach((order) => {
      totalSpent += Number(order.totalAmount);
      totalTickets += order.orderItems.length;

      if (order.event.eventDate >= now) {
        upcomingEvents++;
      } else {
        pastEvents++;
      }
    });

    return {
      totalOrders: orders.length,
      totalSpent,
      paidOrders: paidOrders.length,
      cancelledOrders: cancelledOrders.length,
      refundedOrders: refundedOrders.length,
      totalTickets,
      upcomingEvents,
      pastEvents,
    };
  }

  async downloadReceipt(clerkUserId: string, orderId: string) {
    const order = await this.getOrderById(clerkUserId, orderId);

    // In a real implementation, you would:
    // 1. Generate a PDF receipt
    // 2. Return the PDF as a downloadable file
    // For now, we'll return the order data in a receipt format

    return {
      receipt: {
        orderId: order.id,
        orderDate: order.createdAt,
        status: order.status,
        customer: {
          name: `${order.firstName} ${order.lastName}`,
          email: order.email,
          phone: order.phone,
        },
        event: {
          name: `${order.event.homeTeam} vs ${order.event.awayTeam}`,
          nameHe: `${order.event.homeTeamHe} נגד ${order.event.awayTeamHe}`,
          date: order.event.eventDate,
          venue: order.event.stadium.name,
          venueHe: order.event.stadium.nameHe,
        },
        tickets: order.orderItems.map((item) => ({
          section: item.seat.section,
          row: item.seat.row,
          seat: item.seat.number,
          price: item.price,
        })),
        total: order.totalAmount,
        currency: order.currency,
      },
    };
  }

  private formatOrder(order: any) {
    return {
      ...order,
      totalAmount: Number(order.totalAmount),
      orderItems: order.orderItems?.map((item: any) => ({
        ...item,
        price: Number(item.price),
        seat: item.ticketInventory?.seat,
      })),
    };
  }

  private formatOrderDetails(order: any): OrderDetailsDto {
    return {
      id: order.id,
      userId: order.userId,
      eventId: order.eventId,
      totalAmount: Number(order.totalAmount),
      currency: order.currency,
      status: order.status,
      email: order.email,
      firstName: order.firstName,
      lastName: order.lastName,
      phone: order.phone,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      event: {
        id: order.event.id,
        homeTeam: order.event.homeTeam,
        homeTeamHe: order.event.homeTeamHe,
        awayTeam: order.event.awayTeam,
        awayTeamHe: order.event.awayTeamHe,
        eventDate: order.event.eventDate,
        stadium: {
          name: order.event.stadium.name,
          nameHe: order.event.stadium.nameHe,
          city: order.event.stadium.city,
          cityHe: order.event.stadium.cityHe,
        },
      },
      orderItems: order.orderItems.map((item: any) => ({
        id: item.id,
        price: Number(item.price),
        attended: item.attended,
        attendedAt: item.attendedAt,
        seat: {
          section: item.ticketInventory.seat.section,
          row: item.ticketInventory.seat.row,
          number: item.ticketInventory.seat.number,
        },
        transfer: item.transfer,
      })),
    };
  }
}
