import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminGuard } from '@app/account-types/guards/admin.guard';
import { CreateSuspendedDto } from '@app/suspended/dto/create-suspended.dto';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard, AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  async getUsers() {
    return await this.adminService.getAllUsersWithSubscriptionStatus();
  }

  @Get('suspended-users')
  async getSuspendedUsers() {
    return await this.adminService.getAllSuspended();
  }

  @Get('users/:id/suspended')
  async checkUserSuspended(@Param('id') userId: string) {
    return await this.adminService.checkUserSuspended(userId);
  }

  @Post('users/:id/suspend')
  async suspendUser(@Body() dto: CreateSuspendedDto) {
    return await this.adminService.suspendUser(dto);
  }

  @Post('users/:id/unsuspend')
  async unsuspendUser(@Param('id') userId: string) {
    return this.adminService.unsuspendUser(userId);
  }
}
