import { MessagesService } from '@app/messages/messages.service';
import { CreateSuspendedDto } from '@app/suspended/dto/create-suspended.dto';
import { SuspendedService } from '@app/suspended/suspended.service';
import { UsersService } from '@app/users/users.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AdminService {
  constructor(
    private readonly userService: UsersService,
    private readonly suspendedService: SuspendedService,
    private readonly messageService: MessagesService,
  ) {}

  async getAllUsersWithSubscriptionStatus() {
    return await this.userService.findAllWithSubscriptionStatus();
  }

  async suspendUser(dto: CreateSuspendedDto) {
    const existingSuspension = this.suspendedService.findOneByUserId(
      dto.userId,
    );
    if (!existingSuspension) {
      return await this.suspendedService.createOne(dto);
    }
    return { message: 'This user is already suspended' };
  }

  async unsuspendUser(userId: string) {
    return await this.suspendedService.removeOne(userId);
  }

  async getAllSuspended() {
    return await this.suspendedService.findAll();
  }

  async checkUserSuspended(userId: string) {
    const suspended = await this.suspendedService.findOneByUserId(userId);
    const isSuspended: boolean = !!suspended;
    return { isSuspended, suspended };
  }

  async removeMessage(messageId: string) {}
}
