import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { TransfersService } from './transfers.service';
import {
  CreateTransferDto,
  AcceptTransferDto,
  RejectTransferDto,
  CancelTransferDto,
} from './dto/transfer.dto';

@Controller('transfers')
@UseGuards(AuthGuard)
export class TransfersController {
  constructor(private readonly transfersService: TransfersService) {}

  @Get()
  async getAllTransfers(@Request() req) {
    return this.transfersService.getAllTransfers(req.user.userId);
  }

  @Get('sent')
  async getSentTransfers(@Request() req) {
    return this.transfersService.getSentTransfers(req.user.userId);
  }

  @Get('received')
  async getReceivedTransfers(@Request() req) {
    return this.transfersService.getReceivedTransfers(req.user.userId);
  }

  @Get('pending')
  async getPendingTransfers(@Request() req) {
    return this.transfersService.getPendingTransfers(req.user.userId);
  }

  @Get('stats')
  async getStats(@Request() req) {
    return this.transfersService.getStats(req.user.userId);
  }

  @Post()
  async createTransfer(@Request() req, @Body() createDto: CreateTransferDto) {
    return this.transfersService.createTransfer(req.user.userId, createDto);
  }

  @Post('accept')
  async acceptTransfer(@Request() req, @Body() acceptDto: AcceptTransferDto) {
    return this.transfersService.acceptTransfer(req.user.userId, acceptDto);
  }

  @Post('reject')
  async rejectTransfer(@Request() req, @Body() rejectDto: RejectTransferDto) {
    return this.transfersService.rejectTransfer(req.user.userId, rejectDto);
  }

  @Post('cancel')
  async cancelTransfer(@Request() req, @Body() cancelDto: CancelTransferDto) {
    return this.transfersService.cancelTransfer(req.user.userId, cancelDto);
  }
}
