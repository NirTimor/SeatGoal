import { PaymentMethodType } from '@prisma/client';

export class PaymentMethodDto {
  id: string;
  userProfileId: string;
  type: PaymentMethodType;
  provider: string;
  last4: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  holderName?: string;
  isDefault: boolean;
  billingAddress?: any;
  createdAt: Date;
  updatedAt: Date;
}

export class CreatePaymentMethodDto {
  type: PaymentMethodType;
  provider?: string;
  providerMethodId: string; // Stripe payment method ID or similar
  last4: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  holderName?: string;
  isDefault?: boolean;
  billingAddress?: BillingAddressDto;
}

export class BillingAddressDto {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

export class UpdatePaymentMethodDto {
  holderName?: string;
  isDefault?: boolean;
  billingAddress?: BillingAddressDto;
}

export class SetDefaultPaymentMethodDto {
  paymentMethodId: string;
}

export class PaymentMethodListResponseDto {
  methods: PaymentMethodDto[];
  defaultMethod?: PaymentMethodDto;
  total: number;
}
