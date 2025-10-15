import { z } from 'zod';

export const SeatStatusSchema = z.enum([
  'AVAILABLE',
  'HELD',
  'SOLD',
  'UNAVAILABLE',
]);

export type SeatStatus = z.infer<typeof SeatStatusSchema>;

export const SeatSchema = z.object({
  id: z.string().uuid(),
  stadiumId: z.string().uuid(),
  section: z.string().min(1),
  row: z.string().min(1),
  number: z.string().min(1),
  x: z.number().optional(),
  y: z.number().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Seat = z.infer<typeof SeatSchema>;

export const TicketInventorySchema = z.object({
  id: z.string().uuid(),
  eventId: z.string().uuid(),
  seatId: z.string().uuid(),
  price: z.number().positive(),
  status: SeatStatusSchema,
  holdExpiresAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type TicketInventory = z.infer<typeof TicketInventorySchema>;

export const SeatWithInventorySchema = SeatSchema.extend({
  inventory: TicketInventorySchema.nullable(),
});

export type SeatWithInventory = z.infer<typeof SeatWithInventorySchema>;

