import { z } from 'zod';

export const CheckoutSessionRequestSchema = z.object({
  holdId: z.string().uuid(),
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(1),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

export type CheckoutSessionRequest = z.infer<typeof CheckoutSessionRequestSchema>;

export const CheckoutSessionResponseSchema = z.object({
  sessionId: z.string(),
  redirectUrl: z.string().url(),
  orderId: z.string().uuid(),
});

export type CheckoutSessionResponse = z.infer<typeof CheckoutSessionResponseSchema>;

