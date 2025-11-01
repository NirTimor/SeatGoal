import {
  Controller,
  Post,
  Body,
  Get,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './public.decorator';
import { User } from './user.decorator';

interface SendCodeDto {
  email?: string;
  phone?: string;
  idCard: string;
}

interface VerifyCodeDto {
  email?: string;
  phone?: string;
  code: string;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('send-code')
  @HttpCode(HttpStatus.OK)
  async sendCode(@Body() dto: SendCodeDto) {
    return this.authService.sendVerificationCode(dto);
  }

  @Public()
  @Post('verify-code')
  @HttpCode(HttpStatus.OK)
  async verifyCode(@Body() dto: VerifyCodeDto) {
    return this.authService.verifyCode(dto);
  }

  @Get('me')
  async getProfile(@User('userId') userId: string) {
    return this.authService.getProfile(userId);
  }
}

