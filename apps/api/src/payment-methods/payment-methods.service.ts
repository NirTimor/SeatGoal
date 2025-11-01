import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreatePaymentMethodDto,
  UpdatePaymentMethodDto,
  SetDefaultPaymentMethodDto,
  PaymentMethodListResponseDto,
} from './dto/payment-method.dto';

@Injectable()
export class PaymentMethodsService {
  constructor(private prisma: PrismaService) {}

  async getAllPaymentMethods(
    clerkUserId: string,
  ): Promise<PaymentMethodListResponseDto> {
    const profile = await this.getProfile(clerkUserId);

    const methods = await this.prisma.paymentMethod.findMany({
      where: { userProfileId: profile.id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    const defaultMethod = methods.find((m) => m.isDefault);

    return {
      methods: methods.map(this.sanitizePaymentMethod),
      defaultMethod: defaultMethod
        ? this.sanitizePaymentMethod(defaultMethod)
        : undefined,
      total: methods.length,
    };
  }

  async getPaymentMethod(clerkUserId: string, paymentMethodId: string) {
    const profile = await this.getProfile(clerkUserId);

    const method = await this.prisma.paymentMethod.findFirst({
      where: {
        id: paymentMethodId,
        userProfileId: profile.id,
      },
    });

    if (!method) {
      throw new NotFoundException('Payment method not found');
    }

    return this.sanitizePaymentMethod(method);
  }

  async getDefaultPaymentMethod(clerkUserId: string) {
    const profile = await this.getProfile(clerkUserId);

    const method = await this.prisma.paymentMethod.findFirst({
      where: {
        userProfileId: profile.id,
        isDefault: true,
      },
    });

    if (!method) {
      throw new NotFoundException('No default payment method found');
    }

    return this.sanitizePaymentMethod(method);
  }

  async createPaymentMethod(
    clerkUserId: string,
    createDto: CreatePaymentMethodDto,
  ) {
    const profile = await this.getProfile(clerkUserId);

    // If this is set as default, unset all other defaults
    if (createDto.isDefault) {
      await this.prisma.paymentMethod.updateMany({
        where: { userProfileId: profile.id },
        data: { isDefault: false },
      });
    }

    // If this is the first payment method, make it default
    const existingCount = await this.prisma.paymentMethod.count({
      where: { userProfileId: profile.id },
    });

    const isDefault = createDto.isDefault ?? existingCount === 0;

    const method = await this.prisma.paymentMethod.create({
      data: {
        userProfileId: profile.id,
        type: createDto.type,
        provider: createDto.provider || 'stripe',
        providerMethodId: createDto.providerMethodId,
        last4: createDto.last4,
        brand: createDto.brand,
        expiryMonth: createDto.expiryMonth,
        expiryYear: createDto.expiryYear,
        holderName: createDto.holderName,
        isDefault,
        billingAddress: createDto.billingAddress as any,
      },
    });

    return this.sanitizePaymentMethod(method);
  }

  async updatePaymentMethod(
    clerkUserId: string,
    paymentMethodId: string,
    updateDto: UpdatePaymentMethodDto,
  ) {
    const profile = await this.getProfile(clerkUserId);

    const method = await this.prisma.paymentMethod.findFirst({
      where: {
        id: paymentMethodId,
        userProfileId: profile.id,
      },
    });

    if (!method) {
      throw new NotFoundException('Payment method not found');
    }

    // If setting as default, unset all other defaults
    if (updateDto.isDefault) {
      await this.prisma.paymentMethod.updateMany({
        where: {
          userProfileId: profile.id,
          id: { not: paymentMethodId },
        },
        data: { isDefault: false },
      });
    }

    const updated = await this.prisma.paymentMethod.update({
      where: { id: paymentMethodId },
      data: {
        ...updateDto,
        billingAddress: updateDto.billingAddress as any,
      },
    });

    return this.sanitizePaymentMethod(updated);
  }

  async setDefaultPaymentMethod(
    clerkUserId: string,
    setDefaultDto: SetDefaultPaymentMethodDto,
  ) {
    const profile = await this.getProfile(clerkUserId);

    const method = await this.prisma.paymentMethod.findFirst({
      where: {
        id: setDefaultDto.paymentMethodId,
        userProfileId: profile.id,
      },
    });

    if (!method) {
      throw new NotFoundException('Payment method not found');
    }

    // Unset all other defaults
    await this.prisma.paymentMethod.updateMany({
      where: {
        userProfileId: profile.id,
        id: { not: setDefaultDto.paymentMethodId },
      },
      data: { isDefault: false },
    });

    // Set this one as default
    const updated = await this.prisma.paymentMethod.update({
      where: { id: setDefaultDto.paymentMethodId },
      data: { isDefault: true },
    });

    return this.sanitizePaymentMethod(updated);
  }

  async deletePaymentMethod(clerkUserId: string, paymentMethodId: string) {
    const profile = await this.getProfile(clerkUserId);

    const method = await this.prisma.paymentMethod.findFirst({
      where: {
        id: paymentMethodId,
        userProfileId: profile.id,
      },
    });

    if (!method) {
      throw new NotFoundException('Payment method not found');
    }

    // If deleting the default method, set another one as default
    if (method.isDefault) {
      const otherMethod = await this.prisma.paymentMethod.findFirst({
        where: {
          userProfileId: profile.id,
          id: { not: paymentMethodId },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (otherMethod) {
        await this.prisma.paymentMethod.update({
          where: { id: otherMethod.id },
          data: { isDefault: true },
        });
      }
    }

    await this.prisma.paymentMethod.delete({
      where: { id: paymentMethodId },
    });

    // In a real implementation, you would also:
    // 1. Delete the payment method from Stripe/payment provider
    // 2. Send notification to user

    return { message: 'Payment method deleted successfully' };
  }

  async validateCardExpiry(expiryMonth: number, expiryYear: number): Promise<boolean> {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (expiryYear < currentYear) {
      return false;
    }

    if (expiryYear === currentYear && expiryMonth < currentMonth) {
      return false;
    }

    return true;
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

  private sanitizePaymentMethod(method: any) {
    // Remove sensitive data like providerMethodId from response
    const { providerMethodId, ...sanitized } = method;
    return sanitized;
  }
}
