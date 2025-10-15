import { z } from 'zod';

export const OrderStatusSchema = z.enum([
  'PENDING',
  'PAID',
  'CANCELLED',
  'REFUNDED',
]);

export type OrderStatus = z.infer<typeof OrderStatusSchema>;

export const OrderSchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  eventId: z.string().uuid(),
  seats: z.array(z.string().uuid()),
  totalAmount: z.number().positive(),
  currency: z.string().default('ILS'),
  status: OrderStatusSchema,
  paymentIntentId: z.string().nullable(),
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(1),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Order = z.infer<typeof OrderSchema>;

export const CreateOrderSchema = OrderSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true,
  paymentIntentId: true,
}).extend({
  holdId: z.string().uuid(),
});

export type CreateOrder = z.infer<typeof CreateOrderSchema>;

