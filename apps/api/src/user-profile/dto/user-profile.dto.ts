import { Gender } from '@prisma/client';

export class UserProfileDto {
  id: string;
  clerkUserId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  idNumber?: string; // Will be censored in response
  birthDate?: Date;
  gender?: Gender;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  postalCode?: string;
  country: string;
  createdAt: Date;
  updatedAt: Date;
}

export class CreateUserProfileDto {
  clerkUserId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  idNumber?: string;
  birthDate?: Date;
  gender?: Gender;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  postalCode?: string;
  country?: string;
}

export class UpdateUserProfileDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  idNumber?: string;
  birthDate?: Date;
  gender?: Gender;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  postalCode?: string;
}

export class UserProfileResponseDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  idNumberLast4?: string; // Only last 4 digits
  birthDate?: Date;
  gender?: Gender;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  postalCode?: string;
  country: string;
  createdAt: Date;
  updatedAt: Date;
}
