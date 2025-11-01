import { TransferStatus } from '@prisma/client';

export class TicketTransferDto {
  id: string;
  orderItemId: string;
  senderProfileId: string;
  receiverEmail: string;
  receiverProfileId?: string;
  status: TransferStatus;
  message?: string;
  expiresAt: Date;
  acceptedAt?: Date;
  rejectedAt?: Date;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  // Populated fields
  event?: any;
  seat?: any;
  sender?: any;
  receiver?: any;
}

export class CreateTransferDto {
  orderItemId: string;
  receiverEmail: string;
  message?: string;
  expiresInDays?: number; // Default 7 days
}

export class AcceptTransferDto {
  transferId: string;
}

export class RejectTransferDto {
  transferId: string;
  reason?: string;
}

export class CancelTransferDto {
  transferId: string;
}

export class TransferListResponseDto {
  sent: TicketTransferDto[];
  received: TicketTransferDto[];
  pendingReceived: number;
  total: number;
}

export class TransferStatsDto {
  totalSent: number;
  totalReceived: number;
  pendingSent: number;
  pendingReceived: number;
  acceptedSent: number;
  acceptedReceived: number;
  rejectedSent: number;
  rejectedReceived: number;
}
