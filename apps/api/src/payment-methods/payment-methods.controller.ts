import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { PaymentMethodsService } from './payment-methods.service';
import {
  CreatePaymentMethodDto,
  UpdatePaymentMethodDto,
  SetDefaultPaymentMethodDto,
} from './dto/payment-method.dto';

@Controller('payment-methods')
@UseGuards(AuthGuard)
export class PaymentMethodsController {
  constructor(
    private readonly paymentMethodsService: PaymentMethodsService,
  ) {}

  @Get()
  async getAllPaymentMethods(@Request() req) {
    return this.paymentMethodsService.getAllPaymentMethods(req.user.userId);
  }

  @Get('default')
  async getDefaultPaymentMethod(@Request() req) {
    return this.paymentMethodsService.getDefaultPaymentMethod(req.user.userId);
  }

  @Get(':id')
  async getPaymentMethod(@Request() req, @Param('id') id: string) {
    return this.paymentMethodsService.getPaymentMethod(req.user.userId, id);
  }

  @Post()
  async createPaymentMethod(
    @Request() req,
    @Body() createDto: CreatePaymentMethodDto,
  ) {
    return this.paymentMethodsService.createPaymentMethod(
      req.user.userId,
      createDto,
    );
  }

  @Put(':id')
  async updatePaymentMethod(
    @Request() req,
    @Param('id') id: string,
    @Body() updateDto: UpdatePaymentMethodDto,
  ) {
    return this.paymentMethodsService.updatePaymentMethod(
      req.user.userId,
      id,
      updateDto,
    );
  }

  @Post('set-default')
  async setDefaultPaymentMethod(
    @Request() req,
    @Body() setDefaultDto: SetDefaultPaymentMethodDto,
  ) {
    return this.paymentMethodsService.setDefaultPaymentMethod(
      req.user.userId,
      setDefaultDto,
    );
  }

  @Delete(':id')
  async deletePaymentMethod(@Request() req, @Param('id') id: string) {
    return this.paymentMethodsService.deletePaymentMethod(
      req.user.userId,
      id,
    );
  }
}
