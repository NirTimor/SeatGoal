import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateUserProfileDto,
  UpdateUserProfileDto,
  UserProfileResponseDto,
} from './dto/user-profile.dto';

@Injectable()
export class UserProfileService {
  constructor(private prisma: PrismaService) {}

  async findByClerkUserId(clerkUserId: string): Promise<UserProfileResponseDto> {
    const profile = await this.prisma.userProfile.findUnique({
      where: { clerkUserId },
    });

    if (!profile) {
      throw new NotFoundException('User profile not found');
    }

    return this.sanitizeProfile(profile);
  }

  async findById(id: string): Promise<UserProfileResponseDto> {
    const profile = await this.prisma.userProfile.findUnique({
      where: { id },
    });

    if (!profile) {
      throw new NotFoundException('User profile not found');
    }

    return this.sanitizeProfile(profile);
  }

  async create(
    createDto: CreateUserProfileDto,
  ): Promise<UserProfileResponseDto> {
    // Check if profile already exists
    const existing = await this.prisma.userProfile.findUnique({
      where: { clerkUserId: createDto.clerkUserId },
    });

    if (existing) {
      throw new ConflictException('User profile already exists');
    }

    // Check if email is already used
    const emailExists = await this.prisma.userProfile.findUnique({
      where: { email: createDto.email },
    });

    if (emailExists) {
      throw new ConflictException('Email already in use');
    }

    const profile = await this.prisma.userProfile.create({
      data: {
        ...createDto,
        country: createDto.country || 'IL',
      },
    });

    return this.sanitizeProfile(profile);
  }

  async update(
    clerkUserId: string,
    updateDto: UpdateUserProfileDto,
  ): Promise<UserProfileResponseDto> {
    const profile = await this.prisma.userProfile.findUnique({
      where: { clerkUserId },
    });

    if (!profile) {
      throw new NotFoundException('User profile not found');
    }

    // If updating ID number, check it's not already used
    if (updateDto.idNumber && updateDto.idNumber !== profile.idNumber) {
      const idExists = await this.prisma.userProfile.findFirst({
        where: {
          idNumber: updateDto.idNumber,
          id: { not: profile.id },
        },
      });

      if (idExists) {
        throw new ConflictException('ID number already in use');
      }
    }

    const updated = await this.prisma.userProfile.update({
      where: { clerkUserId },
      data: updateDto,
    });

    return this.sanitizeProfile(updated);
  }

  async delete(clerkUserId: string): Promise<void> {
    const profile = await this.prisma.userProfile.findUnique({
      where: { clerkUserId },
    });

    if (!profile) {
      throw new NotFoundException('User profile not found');
    }

    await this.prisma.userProfile.delete({
      where: { clerkUserId },
    });
  }

  async getOrCreate(
    clerkUserId: string,
    email: string,
    firstName: string,
    lastName: string,
  ): Promise<UserProfileResponseDto> {
    let profile = await this.prisma.userProfile.findUnique({
      where: { clerkUserId },
    });

    if (!profile) {
      profile = await this.prisma.userProfile.create({
        data: {
          clerkUserId,
          email,
          firstName,
          lastName,
          country: 'IL',
        },
      });
    }

    return this.sanitizeProfile(profile);
  }

  private sanitizeProfile(profile: any): UserProfileResponseDto {
    return {
      id: profile.id,
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      phone: profile.phone,
      // Censor ID number - show only last 4 digits
      idNumberLast4: profile.idNumber
        ? profile.idNumber.slice(-4).padStart(profile.idNumber.length, '*')
        : undefined,
      birthDate: profile.birthDate,
      gender: profile.gender,
      addressLine1: profile.addressLine1,
      addressLine2: profile.addressLine2,
      city: profile.city,
      postalCode: profile.postalCode,
      country: profile.country,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }
}
