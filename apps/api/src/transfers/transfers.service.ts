import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransferStatus, OrderStatus } from '@prisma/client';
import {
  CreateTransferDto,
  AcceptTransferDto,
  RejectTransferDto,
  CancelTransferDto,
  TransferListResponseDto,
  TransferStatsDto,
} from './dto/transfer.dto';

@Injectable()
export class TransfersService {
  constructor(private prisma: PrismaService) {}

  async getAllTransfers(clerkUserId: string): Promise<TransferListResponseDto> {
    const profile = await this.getProfile(clerkUserId);

    const [sent, received] = await Promise.all([
      this.prisma.ticketTransfer.findMany({
        where: { senderProfileId: profile.id },
        include: {
          orderItem: {
            include: {
              ticketInventory: {
                include: {
                  event: true,
                  seat: true,
                },
              },
            },
          },
          receiver: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.ticketTransfer.findMany({
        where: {
          OR: [
            { receiverProfileId: profile.id },
            { receiverEmail: profile.email },
          ],
        },
        include: {
          orderItem: {
            include: {
              ticketInventory: {
                include: {
                  event: true,
                  seat: true,
                },
              },
            },
          },
          sender: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const pendingReceived = received.filter(
      (t) => t.status === TransferStatus.PENDING,
    ).length;

    return {
      sent: sent.map(this.formatTransfer),
      received: received.map(this.formatTransfer),
      pendingReceived,
      total: sent.length + received.length,
    };
  }

  async getSentTransfers(clerkUserId: string) {
    const profile = await this.getProfile(clerkUserId);

    const transfers = await this.prisma.ticketTransfer.findMany({
      where: { senderProfileId: profile.id },
      include: {
        orderItem: {
          include: {
            ticketInventory: {
              include: {
                event: true,
                seat: true,
              },
            },
          },
        },
        receiver: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return transfers.map(this.formatTransfer);
  }

  async getReceivedTransfers(clerkUserId: string) {
    const profile = await this.getProfile(clerkUserId);

    const transfers = await this.prisma.ticketTransfer.findMany({
      where: {
        OR: [
          { receiverProfileId: profile.id },
          { receiverEmail: profile.email },
        ],
      },
      include: {
        orderItem: {
          include: {
            ticketInventory: {
              include: {
                event: true,
                seat: true,
              },
            },
          },
        },
        sender: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return transfers.map(this.formatTransfer);
  }

  async getPendingTransfers(clerkUserId: string) {
    const profile = await this.getProfile(clerkUserId);

    const transfers = await this.prisma.ticketTransfer.findMany({
      where: {
        OR: [
          { receiverProfileId: profile.id },
          { receiverEmail: profile.email },
        ],
        status: TransferStatus.PENDING,
      },
      include: {
        orderItem: {
          include: {
            ticketInventory: {
              include: {
                event: true,
                seat: true,
              },
            },
          },
        },
        sender: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return transfers.map(this.formatTransfer);
  }

  async createTransfer(clerkUserId: string, createDto: CreateTransferDto) {
    const profile = await this.getProfile(clerkUserId);

    // Verify order item belongs to user
    const orderItem = await this.prisma.orderItem.findFirst({
      where: {
        id: createDto.orderItemId,
        order: {
          userId: clerkUserId,
          status: OrderStatus.PAID,
        },
      },
      include: {
        transfer: true,
        ticketInventory: {
          include: {
            event: true,
          },
        },
      },
    });

    if (!orderItem) {
      throw new NotFoundException('Order item not found or not paid');
    }

    // Check if ticket already has an active transfer
    if (orderItem.transfer && orderItem.transfer.status === TransferStatus.PENDING) {
      throw new BadRequestException('Ticket already has a pending transfer');
    }

    // Check if event has already occurred
    if (orderItem.ticketInventory.event.eventDate < new Date()) {
      throw new BadRequestException('Cannot transfer ticket for past event');
    }

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (createDto.expiresInDays || 7));

    // Don't allow expiration after event date
    if (expiresAt > orderItem.ticketInventory.event.eventDate) {
      expiresAt.setTime(orderItem.ticketInventory.event.eventDate.getTime());
    }

    // Check if receiver exists in system
    const receiverProfile = await this.prisma.userProfile.findUnique({
      where: { email: createDto.receiverEmail },
    });

    const transfer = await this.prisma.ticketTransfer.create({
      data: {
        orderItemId: createDto.orderItemId,
        senderProfileId: profile.id,
        receiverEmail: createDto.receiverEmail,
        receiverProfileId: receiverProfile?.id,
        message: createDto.message,
        expiresAt,
        status: TransferStatus.PENDING,
      },
      include: {
        orderItem: {
          include: {
            ticketInventory: {
              include: {
                event: true,
                seat: true,
              },
            },
          },
        },
        sender: true,
        receiver: true,
      },
    });

    return this.formatTransfer(transfer);
  }

  async acceptTransfer(clerkUserId: string, acceptDto: AcceptTransferDto) {
    const profile = await this.getProfile(clerkUserId);

    const transfer = await this.prisma.ticketTransfer.findUnique({
      where: { id: acceptDto.transferId },
      include: {
        orderItem: {
          include: {
            order: true,
            ticketInventory: {
              include: {
                event: true,
              },
            },
          },
        },
      },
    });

    if (!transfer) {
      throw new NotFoundException('Transfer not found');
    }

    // Verify receiver
    if (
      transfer.receiverProfileId !== profile.id &&
      transfer.receiverEmail !== profile.email
    ) {
      throw new ForbiddenException('You are not authorized to accept this transfer');
    }

    // Check if transfer is still pending
    if (transfer.status !== TransferStatus.PENDING) {
      throw new BadRequestException('Transfer is not pending');
    }

    // Check if transfer has expired
    if (transfer.expiresAt < new Date()) {
      await this.prisma.ticketTransfer.update({
        where: { id: acceptDto.transferId },
        data: { status: TransferStatus.EXPIRED },
      });
      throw new BadRequestException('Transfer has expired');
    }

    // Update transfer status
    const updated = await this.prisma.ticketTransfer.update({
      where: { id: acceptDto.transferId },
      data: {
        status: TransferStatus.ACCEPTED,
        acceptedAt: new Date(),
        receiverProfileId: profile.id, // Update receiver profile if it was null
      },
      include: {
        orderItem: {
          include: {
            ticketInventory: {
              include: {
                event: true,
                seat: true,
              },
            },
          },
        },
        sender: true,
        receiver: true,
      },
    });

    // In a real implementation, you would:
    // 1. Create a new order for the receiver
    // 2. Transfer ownership of the ticket
    // 3. Send notifications to both parties

    return this.formatTransfer(updated);
  }

  async rejectTransfer(clerkUserId: string, rejectDto: RejectTransferDto) {
    const profile = await this.getProfile(clerkUserId);

    const transfer = await this.prisma.ticketTransfer.findUnique({
      where: { id: rejectDto.transferId },
    });

    if (!transfer) {
      throw new NotFoundException('Transfer not found');
    }

    // Verify receiver
    if (
      transfer.receiverProfileId !== profile.id &&
      transfer.receiverEmail !== profile.email
    ) {
      throw new ForbiddenException('You are not authorized to reject this transfer');
    }

    // Check if transfer is still pending
    if (transfer.status !== TransferStatus.PENDING) {
      throw new BadRequestException('Transfer is not pending');
    }

    const updated = await this.prisma.ticketTransfer.update({
      where: { id: rejectDto.transferId },
      data: {
        status: TransferStatus.REJECTED,
        rejectedAt: new Date(),
      },
      include: {
        orderItem: {
          include: {
            ticketInventory: {
              include: {
                event: true,
                seat: true,
              },
            },
          },
        },
        sender: true,
        receiver: true,
      },
    });

    return this.formatTransfer(updated);
  }

  async cancelTransfer(clerkUserId: string, cancelDto: CancelTransferDto) {
    const profile = await this.getProfile(clerkUserId);

    const transfer = await this.prisma.ticketTransfer.findUnique({
      where: { id: cancelDto.transferId },
    });

    if (!transfer) {
      throw new NotFoundException('Transfer not found');
    }

    // Verify sender
    if (transfer.senderProfileId !== profile.id) {
      throw new ForbiddenException('You are not authorized to cancel this transfer');
    }

    // Check if transfer is still pending
    if (transfer.status !== TransferStatus.PENDING) {
      throw new BadRequestException('Only pending transfers can be cancelled');
    }

    const updated = await this.prisma.ticketTransfer.update({
      where: { id: cancelDto.transferId },
      data: {
        status: TransferStatus.CANCELLED,
        cancelledAt: new Date(),
      },
      include: {
        orderItem: {
          include: {
            ticketInventory: {
              include: {
                event: true,
                seat: true,
              },
            },
          },
        },
        sender: true,
        receiver: true,
      },
    });

    return this.formatTransfer(updated);
  }

  async getStats(clerkUserId: string): Promise<TransferStatsDto> {
    const profile = await this.getProfile(clerkUserId);

    const [sent, received] = await Promise.all([
      this.prisma.ticketTransfer.findMany({
        where: { senderProfileId: profile.id },
      }),
      this.prisma.ticketTransfer.findMany({
        where: {
          OR: [
            { receiverProfileId: profile.id },
            { receiverEmail: profile.email },
          ],
        },
      }),
    ]);

    return {
      totalSent: sent.length,
      totalReceived: received.length,
      pendingSent: sent.filter((t) => t.status === TransferStatus.PENDING).length,
      pendingReceived: received.filter((t) => t.status === TransferStatus.PENDING)
        .length,
      acceptedSent: sent.filter((t) => t.status === TransferStatus.ACCEPTED).length,
      acceptedReceived: received.filter((t) => t.status === TransferStatus.ACCEPTED)
        .length,
      rejectedSent: sent.filter((t) => t.status === TransferStatus.REJECTED).length,
      rejectedReceived: received.filter((t) => t.status === TransferStatus.REJECTED)
        .length,
    };
  }

  async expireTransfers() {
    const now = new Date();

    const result = await this.prisma.ticketTransfer.updateMany({
      where: {
        status: TransferStatus.PENDING,
        expiresAt: {
          lte: now,
        },
      },
      data: {
        status: TransferStatus.EXPIRED,
      },
    });

    return { expiredCount: result.count };
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

  private formatTransfer(transfer: any) {
    return {
      ...transfer,
      event: transfer.orderItem?.ticketInventory?.event,
      seat: transfer.orderItem?.ticketInventory?.seat,
    };
  }
}
