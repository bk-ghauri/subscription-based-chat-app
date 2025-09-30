import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { ErrorMessages } from '@app/common/strings/error-messages';
import { UsersService } from '@app/users/users.service';
import { Subscription } from './entities/subscription.entity';
import { Repository } from 'typeorm';
import { SuccessMessages } from '@app/common/strings/success-messages';
import { SubscriptionStatus } from './types/subscription-status.enum';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { AccountTypesService } from '@app/account-types/account-types.service';
import { AccountRole } from '@app/account-types/types/account-role.enum';

export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,

    private readonly userService: UsersService,
    private readonly accountTypeService: AccountTypesService,
  ) {}

  async insertOneIfNotExists(dto: CreateSubscriptionDto) {
    const user = await this.userService.findOne(dto.userId);
    if (!user) {
      throw new Error(ErrorMessages.USER_NOT_FOUND);
    }

    try {
      await this.subscriptionRepository.insert({ ...dto, user });
      return await this.findOneByStripeSubscriptionId(dto.stripeSubscriptionId);
    } catch (err: any) {
      if (err.code === '23505') {
        // unique_violation in Postgres
        this.logger.debug(
          `Subscription ${dto.stripeSubscriptionId} already exists, skipping insert.`,
        );
        return { success: true, message: SuccessMessages.SUBSCRIPTION_EXISTS };
      }
      throw err;
    }
  }

  async UpdateorInsertSubscription(dto: CreateSubscriptionDto) {
    const user = await this.userService.findOne(dto.userId);
    if (!user) throw new Error(ErrorMessages.USER_NOT_FOUND);

    // Upsert on unique key: stripeSubscriptionId
    await this.subscriptionRepository.upsert(dto, {
      conflictPaths: ['stripeSubscriptionId'], // column with UNIQUE constraint
      skipUpdateIfNoValuesChanged: true,
    });

    if (dto.status === SubscriptionStatus.ACTIVE)
      return this.findOneByStripeSubscriptionId(dto.stripeSubscriptionId);
  }

  async updateOneByStripeSubscriptionId(dto: UpdateSubscriptionDto) {
    await this.subscriptionRepository.update(
      { stripeSubscriptionId: dto.stripeSubscriptionId },
      dto,
    );
  }

  async findAllByUserId(userId: string) {
    return await this.subscriptionRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });
  }

  async countActiveByUserId(userId: string): Promise<number> {
    return await this.subscriptionRepository.count({
      where: {
        user: { id: userId },
        status: SubscriptionStatus.ACTIVE,
      },
    });
  }

  async findOneByUserId(userId: string) {
    return await this.subscriptionRepository.findOne({
      where: {
        user: { id: userId },
      },
      select: { id: true, stripeCustomerId: true, stripeSubscriptionId: true },
      relations: {
        user: true,
      },
    });
  }

  async findOneByStripeSubscriptionId(stripeSubscriptionId: string) {
    return await this.subscriptionRepository.findOne({
      where: {
        stripeSubscriptionId,
      },
      select: { id: true, stripeSubscriptionId: true, stripeCustomerId: true },
      relations: { user: true },
    });
  }

  async updateAccountType(userId: string, status: SubscriptionStatus) {
    switch (status) {
      case SubscriptionStatus.ACTIVE:
        await this.accountTypeService.updateOne({
          userId,
          role: AccountRole.PREMIUM,
        });
        break;

      case SubscriptionStatus.PAST_DUE:
        await this.accountTypeService.updateOne({
          userId,
          role: AccountRole.FREE,
        });
        break;

      case SubscriptionStatus.CANCELED:
        // Check if no other subscriptions exist for the user
        const role = await this.confirmUserRole(userId);
        await this.accountTypeService.updateOne({
          userId,
          role,
        });
        break;
    }
    this.logger.log(`Account type for user ${userId} updated`);
    return;
  }

  private async confirmUserRole(userId: string) {
    const activeSubscriptions: number = await this.countActiveByUserId(userId);
    const newRole =
      activeSubscriptions > 0 ? AccountRole.PREMIUM : AccountRole.FREE;

    return newRole;
  }
}
