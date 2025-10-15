import { z } from 'zod';

export const WebhookEventTypeSchema = z.enum([
  'PAYMENT_SUCCESS',
  'PAYMENT_FAILED',
  'PAYMENT_CANCELLED',
  'REFUND_PROCESSED',
]);

export type WebhookEventType = z.infer<typeof WebhookEventTypeSchema>;

export const WebhookPayloadSchema = z.object({
  eventType: WebhookEventTypeSchema,
  orderId: z.string().uuid(),
  paymentIntentId: z.string(),
  amount: z.number().positive(),
  currency: z.string(),
  timestamp: z.date(),
  metadata: z.record(z.any()).optional(),
});

export type WebhookPayload = z.infer<typeof WebhookPayloadSchema>;

