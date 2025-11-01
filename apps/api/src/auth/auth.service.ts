import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

interface VerificationRequest {
  email?: string;
  phone?: string;
  idCard: string;
}

interface VerifyCodeRequest {
  email?: string;
  phone?: string;
  code: string;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async sendVerificationCode(request: VerificationRequest): Promise<{
    success: boolean;
    message: string;
  }> {
    const { email, phone, idCard } = request;

    if (!email && !phone) {
      throw new BadRequestException('Either email or phone must be provided');
    }

    if (!idCard) {
      throw new BadRequestException('ID card is required');
    }

    // Generate a 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Code expires in 10 minutes
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // Clean phone number (remove spaces, dashes, etc.)
    const cleanPhone = phone?.replace(/\D/g, '');
    const cleanEmail = email?.toLowerCase().trim();

    // In production, you would send this via SMS or email service
    // For MVP, we'll just store it in the database
    await this.prisma.verificationCode.create({
      data: {
        email: cleanEmail,
        phone: cleanPhone,
        idCard,
        code,
        expiresAt,
      },
    });

    // TODO: In production, integrate with SMS gateway (like Twilio) or Email service (like SendGrid)
    // For now, we'll log the code to console for development
    console.log(`[DEV ONLY] Verification code for ${cleanEmail || cleanPhone}: ${code}`);

    return {
      success: true,
      message: email
        ? 'Verification code sent to your email'
        : 'Verification code sent to your phone',
    };
  }

  async verifyCode(request: VerifyCodeRequest): Promise<{
    success: boolean;
    token?: string;
    user?: any;
    message?: string;
  }> {
    const { email, phone, code } = request;

    if (!email && !phone) {
      throw new BadRequestException('Either email or phone must be provided');
    }

    const cleanPhone = phone?.replace(/\D/g, '');
    const cleanEmail = email?.toLowerCase().trim();

    // Find the verification code
    const verification = await this.prisma.verificationCode.findFirst({
      where: {
        OR: [{ email: cleanEmail }, { phone: cleanPhone }],
        code,
        verified: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!verification) {
      throw new UnauthorizedException('Invalid or expired verification code');
    }

    // Mark code as verified
    await this.prisma.verificationCode.update({
      where: { id: verification.id },
      data: { verified: true },
    });

    const idCard = verification.idCard;

    // Find or create user
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: cleanEmail }, { phone: cleanPhone }],
      },
    });

    if (user) {
      // Update user if email/phone changed
      if (!user.email && cleanEmail) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { email: cleanEmail },
        });
      }
      if (!user.phone && cleanPhone) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { phone: cleanPhone },
        });
      }
    } else {
      // Create new user with ID card from verification
      user = await this.prisma.user.create({
        data: {
          email: cleanEmail,
          phone: cleanPhone,
          idCard,
        },
      });
    }

    // Generate JWT token
    const payload = {
      sub: user.id,
      email: user.email,
      phone: user.phone,
    };

    const token = this.jwtService.sign(payload);

    // Delete old verification codes
    await this.prisma.verificationCode.deleteMany({
      where: {
        OR: [{ email: cleanEmail }, { phone: cleanPhone }],
        verified: true,
      },
    });

    return {
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
      },
      message: 'Verification successful',
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}

