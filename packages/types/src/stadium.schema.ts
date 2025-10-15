import { z } from 'zod';

export const StadiumSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  nameHe: z.string().min(1),
  city: z.string().min(1),
  cityHe: z.string().min(1),
  capacity: z.number().int().positive(),
  svgMap: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Stadium = z.infer<typeof StadiumSchema>;

export const CreateStadiumSchema = StadiumSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateStadium = z.infer<typeof CreateStadiumSchema>;

