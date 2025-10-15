import { z } from 'zod';

export const HoldRequestSchema = z.object({
  eventId: z.string().uuid(),
  seatIds: z.array(z.string().uuid()).min(1).max(10),
  userId: z.string().optional(),
  sessionId: z.string().min(1),
});

export type HoldRequest = z.infer<typeof HoldRequestSchema>;

export const HoldResponseSchema = z.object({
  holdId: z.string().uuid(),
  seats: z.array(z.string().uuid()),
  expiresAt: z.date(),
  totalPrice: z.number().positive(),
});

export type HoldResponse = z.infer<typeof HoldResponseSchema>;

export const ReleaseHoldRequestSchema = z.object({
  holdId: z.string().uuid(),
  sessionId: z.string().min(1),
});

export type ReleaseHoldRequest = z.infer<typeof ReleaseHoldRequestSchema>;

