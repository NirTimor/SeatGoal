import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { UserProfileService } from './user-profile.service';
import {
  CreateUserProfileDto,
  UpdateUserProfileDto,
  UserProfileResponseDto,
} from './dto/user-profile.dto';

@Controller('user-profile')
@UseGuards(AuthGuard)
export class UserProfileController {
  constructor(private readonly userProfileService: UserProfileService) {}

  @Get()
  async getProfile(@Request() req): Promise<UserProfileResponseDto> {
    return this.userProfileService.findByClerkUserId(req.user.userId);
  }

  @Post()
  async createProfile(
    @Request() req,
    @Body() createDto: CreateUserProfileDto,
  ): Promise<UserProfileResponseDto> {
    // Override clerkUserId with the authenticated user's ID
    createDto.clerkUserId = req.user.userId;
    return this.userProfileService.create(createDto);
  }

  @Put()
  async updateProfile(
    @Request() req,
    @Body() updateDto: UpdateUserProfileDto,
  ): Promise<UserProfileResponseDto> {
    return this.userProfileService.update(req.user.userId, updateDto);
  }

  @Delete()
  async deleteProfile(@Request() req): Promise<{ message: string }> {
    await this.userProfileService.delete(req.user.userId);
    return { message: 'Profile deleted successfully' };
  }
}
