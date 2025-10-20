import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminGuard } from '@app/account-types/guards/admin.guard';
import { CreateSuspendedDto } from '@app/suspended/dto/create-suspended.dto';
import { JwtAuthGuard } from '@app/auth/utils/Guards';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';

@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  @ApiOperation({
    summary: 'Get all users with subscription status and account type',
  })
  @ApiOkResponse({ description: 'List of users retrieved successfully' })
  @ApiBearerAuth()
  async getUsers() {
    return await this.adminService.getAllUsersWithSubscriptionStatus();
  }

  @Get('suspended-users')
  @ApiOperation({ summary: 'Get all suspended users' })
  @ApiOkResponse({
    description: 'List of suspended users retrieved successfully',
  })
  @ApiBearerAuth()
  async getSuspendedUsers() {
    return await this.adminService.getAllSuspended();
  }

  @Get('users/:id/suspended')
  @ApiOperation({ summary: 'Check if a user is suspended' })
  @ApiOkResponse({ description: 'Subscription status of user returned' })
  @ApiBearerAuth()
  async checkUserSuspended(@Param('id') userId: string) {
    return await this.adminService.checkUserSuspended(userId);
  }

  @Post('users/:id/suspend')
  @ApiOperation({ summary: 'Suspend a user' })
  @ApiBody({ type: CreateSuspendedDto })
  @ApiBearerAuth()
  async suspendUser(@Body() dto: CreateSuspendedDto) {
    return await this.adminService.suspendUser(dto);
  }

  @Post('users/:id/unsuspend')
  @ApiOperation({ summary: 'Unsuspend a user' })
  @ApiBearerAuth()
  async unsuspendUser(@Param('id') userId: string) {
    return this.adminService.unsuspendUser(userId);
  }

  @Delete('messages/:id')
  @ApiOperation({ summary: 'Remove a message' })
  @ApiBearerAuth()
  async removeMessage(@Param('id') messageId: string) {
    return this.adminService.removeMessage(messageId);
  }
}
