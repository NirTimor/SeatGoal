import { z } from 'zod';

export const EventStatusSchema = z.enum([
  'UPCOMING',
  'ON_SALE',
  'SOLD_OUT',
  'CANCELLED',
  'COMPLETED',
]);

export type EventStatus = z.infer<typeof EventStatusSchema>;

export const EventSchema = z.object({
  id: z.string().uuid(),
  stadiumId: z.string().uuid(),
  homeTeam: z.string().min(1),
  homeTeamHe: z.string().min(1),
  awayTeam: z.string().min(1),
  awayTeamHe: z.string().min(1),
  eventDate: z.date(),
  saleStartDate: z.date(),
  saleEndDate: z.date(),
  status: EventStatusSchema,
  description: z.string().optional(),
  descriptionHe: z.string().optional(),
  imageUrl: z.string().url().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Event = z.infer<typeof EventSchema>;

export const CreateEventSchema = EventSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateEvent = z.infer<typeof CreateEventSchema>;

