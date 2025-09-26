import { UsersService } from '@app/users/users.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Subscription } from './entities/subscription.entity';
import { In, Repository } from 'typeorm';
import { ErrorMessages } from '@app/common/strings/error-messages';
import { StripeService } from './stripe.service';
import { BadRequestException, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { SubscriptionStatus } from './types/subscription-status.enum';
import { AccountRole } from '@app/account-types/types/account-type.enum';
import { AccountTypesService } from '@app/account-types/account-types.service';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';

export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,

    private readonly stripeService: StripeService,
    private readonly userService: UsersService,
    private readonly accountTypeService: AccountTypesService,
  ) {}

  async createCheckoutSession(userId: string) {
    const user = await this.userService.findOne(userId);
    if (!user) {
      throw new Error(ErrorMessages.USER_NOT_FOUND);
    }

    // Get all subscriptions of this user from DB in descending order of creation date
    const subscriptions = await this.findAllByUserId(userId);

    // If no subscriptions exist, create new customer using email
    if (subscriptions.length === 0) {
      return this.stripeService.createSessionForNewCustomer(userId, user.email);
    }

    // Check the most recent subscription status
    const latestSubscription = subscriptions[0];

    if (latestSubscription.status === SubscriptionStatus.ACTIVE) {
      return { success: true, message: 'Already subscribed' };
    }

    // if (latestSubscription.status === SubscriptionStatus.PAST_DUE) {
    //   // Redirect to billing portal
    //   return this.stripeService.createBillingPortalSession(
    //     latestSubscription.stripeCustomerId,
    //   );
    // }

    if (latestSubscription.status === SubscriptionStatus.CANCELED) {
      // Same customer, new subscription
      return this.stripeService.createSessionForExistingCustomer(
        userId,
        latestSubscription.stripeCustomerId,
      );
    }
  }

  async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    this.logger.log(`Handling checkout.session.completed: ${session.id}`);

    const stripeSubscriptionId = session.subscription as string;

    // Check if subscription exists
    const existingSubscription =
      await this.findOneByStripeSubscriptionId(stripeSubscriptionId);

    if (
      existingSubscription
      // && userSubscription.status !== SubscriptionStatus.CANCELED // Even if cancelled, can't create new subscription with same id
    ) {
      return { message: 'Subscription already exists' };
    }

    // Stripe metadata: userId is set when you create the checkout session
    const userId = session.metadata?.userId;
    if (!userId) {
      this.logger.error('checkout.session.completed missing userId metadata');
      return;
    }

    const stripeCustomerId = session.customer as string;

    const newSubscription: CreateSubscriptionDto = {
      userId,
      stripeCustomerId,
      stripeSubscriptionId,
      status: SubscriptionStatus.PAST_DUE, // Default until invoice.payment_succeeded webhook
      currentPeriodEnd: null, // Set when invoice.payment_succeeded webhook received
    };

    return await this.insertOneIfNotExists(newSubscription);

    // return await this.createSubscription(
    //   userId,
    //   stripeCustomerId,
    //   stripeSubscriptionId,
    // );
  }

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
        return { success: true, message: 'Subscription already exists' };
      }
      throw err;
    }
  }

  // async createSubscription(
  //   userId: string,
  //   stripeCustomerId: string,
  //   stripeSubscriptionId: string,
  //   status: SubscriptionStatus = SubscriptionStatus.PAST_DUE, // Default until invoice.payment_succeeded webhook
  //   currentPeriodEnd: Date | null = null, // Default null unless invoice.payment_succeeded webhook
  // ) {
  //   const user = await this.userService.findOne(userId);
  //   if (!user) throw new Error('User not found');

  //   const subscription: CreateSubscriptionDto = {
  //     userId,
  //     stripeCustomerId,
  //     stripeSubscriptionId,
  //     currentPeriodEnd,
  //     status,
  //   };

  //   const savedSubscription = await this.subscriptionRepository.save(
  //     this.subscriptionRepository.create({ ...subscription, user }),
  //   );

  //   return savedSubscription;
  // }

  // async activateSubscription(
  //   userId: string,
  //   stripeCustomerId: string,
  //   stripeSubscriptionId: string,
  //   currentPeriodEnd: Date,
  // ) {
  //   // Check if stripeCustomerId exists for user
  //   const userSubscription = await this.findOneByUserId(userId);
  //   if (!userSubscription) {
  //     return await this.createSubscription(
  //       userId,
  //       stripeCustomerId,
  //       stripeSubscriptionId,
  //       SubscriptionStatus.ACTIVE,
  //       currentPeriodEnd,
  //     );
  //   }

  //   const updateDto: UpdateSubscriptionDto = {
  //     status: SubscriptionStatus.ACTIVE,
  //     currentPeriodEnd,
  //   };

  //   await this.subscriptionRepository.update(
  //     { stripeSubscriptionId: stripeSubscriptionId },
  //     updateDto,
  //   );

  //   await this.accountTypeService.updateOne({
  //     userId,
  //     role: AccountRole.PREMIUM,
  //   });

  //   this.logger.log(`Subscription ${stripeSubscriptionId} marked ACTIVE`);
  //   return;
  // }

  async handleInvoiceSucceeded(invoice: Stripe.Invoice) {
    this.logger.log(`Handling invoice.payment_succeeded: ${invoice.id}`);

    const stripeSubscriptionId = invoice.parent?.subscription_details
      ?.subscription as string;

    if (!stripeSubscriptionId) {
      this.logger.error('Invoice has no subscription ID');
      return;
    }

    // const subscription = await this.findOneByStripeSubscriptionId(
    //   stripeSubscriptionId as string,
    // );

    // if (!subscription) {
    const stripeCustomerId = invoice.customer as string;
    const userId = invoice.parent?.subscription_details?.metadata?.userId; // comes from checkout.session.subscription_data metadata

    if (!userId) {
      this.logger.error(
        `No userId metadata found for subscription ${stripeSubscriptionId}`,
      );
      return;
    }

    // Update current_period_end from Stripe invoice
    const currentPeriodEnd = new Date(
      invoice.lines.data[0].period.end * 1000, // Convert Unix time (seconds) to Date (milliseconds)
    );

    const newSubscription = await this.UpdateorInsertSubscription({
      userId,
      stripeCustomerId,
      stripeSubscriptionId,
      status: SubscriptionStatus.ACTIVE,
      currentPeriodEnd,
    });

    await this.updateAccountType(userId, SubscriptionStatus.ACTIVE);

    this.logger.log(`Subscription ${stripeSubscriptionId} marked ACTIVE`);
    return newSubscription;

    //return await this.activateSubscription();
  }

  async UpdateorInsertSubscription(dto: CreateSubscriptionDto) {
    const user = await this.userService.findOne(dto.userId);
    if (!user) throw new Error('User not found');

    // Upsert on unique key: stripeSubscriptionId
    await this.subscriptionRepository.upsert(dto, {
      conflictPaths: ['stripeSubscriptionId'], // column with UNIQUE constraint
      skipUpdateIfNoValuesChanged: true,
    });

    if (dto.status === SubscriptionStatus.ACTIVE)
      return this.findOneByStripeSubscriptionId(dto.stripeSubscriptionId);
  }

  async handleInvoiceFailed(invoice: Stripe.Invoice) {
    this.logger.warn(`Handling invoice.payment_failed: ${invoice.id}`);

    const stripeSubscriptionId = invoice.parent?.subscription_details
      ?.subscription as string;

    if (!stripeSubscriptionId) {
      this.logger.warn('Invoice has no subscription ID');
      return;
    }

    const stripeCustomerId = invoice.customer as string;
    const userId = invoice.parent?.subscription_details?.metadata?.userId; // comes from checkout.session.subscription_data metadata

    if (!userId) {
      this.logger.error(
        `No userId metadata found for subscription ${stripeSubscriptionId}`,
      );
      return;
    }

    const updatedSubscription = await this.UpdateorInsertSubscription({
      userId,
      stripeCustomerId,
      stripeSubscriptionId,
      status: SubscriptionStatus.ACTIVE, // Leave currentPeriodEnd as is for grace period
    });
    this.logger.log(`Subscription ${stripeSubscriptionId} marked PAST_DUE`);
    return updatedSubscription;

    // const subscription = await this.findOneByStripeSubscriptionId(
    //   stripeSubscriptionId as string,
    // );

    // if (!subscription) {
    //   this.logger.error('Subscription not found');
    //   return;
    // }

    // const updateDto: UpdateSubscriptionDto = {
    //   status: SubscriptionStatus.PAST_DUE,
    // };

    // await this.subscriptionRepository.update(
    //   { stripeSubscriptionId: stripeSubscriptionId as string },
    //   updateDto,
    // );
  }

  async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const stripeSubscriptionId = subscription.id as string;
    const stripeCustomerId = subscription.customer as string;
    const userId = subscription.metadata.userId as string;

    const currentPeriodEnd = subscription.items.data[0].current_period_end
      ? new Date(subscription.items.data[0].current_period_end * 1000)
      : null;

    const statusMap: Record<string, SubscriptionStatus> = {
      active: SubscriptionStatus.ACTIVE,
      past_due: SubscriptionStatus.PAST_DUE,
      canceled: SubscriptionStatus.CANCELED,
      incomplete: SubscriptionStatus.PAST_DUE,
      incomplete_expired: SubscriptionStatus.CANCELED,
      trialing: SubscriptionStatus.ACTIVE,
      unpaid: SubscriptionStatus.PAST_DUE,
    };

    const status =
      statusMap[subscription.status] ?? SubscriptionStatus.PAST_DUE;

    await this.UpdateorInsertSubscription({
      stripeSubscriptionId,
      stripeCustomerId,
      userId,
      status,
      currentPeriodEnd,
    });

    await this.updateAccountType(userId, status);

    this.logger.log(
      `Subscription ${stripeSubscriptionId} updated -> ${status}, periodEnd: ${currentPeriodEnd}`,
    );

    return { success: true };
  }

  async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const stripeSubscriptionId = subscription.id as string;
    const userId = subscription.metadata.userId as string;

    const existingSubscription =
      await this.findOneByStripeSubscriptionId(stripeSubscriptionId);
    if (!existingSubscription) {
      this.logger.warn(
        `Subscription ${stripeSubscriptionId} deleted on Stripe, but not found in DB.`,
      );
      return;
    }

    await this.updateOneByStripeSubscriptionId({
      stripeSubscriptionId,
      status: SubscriptionStatus.CANCELED,
      currentPeriodEnd: null,
    });

    // Check if no other subscriptions exist, then set account role to FREE
    await this.updateAccountType(userId, SubscriptionStatus.CANCELED);

    this.logger.log(
      `Subscription ${stripeSubscriptionId} marked as CANCELED in DB.`,
    );
    return { success: true };
  }

  // async findActiveSubscriptionByUserId(userId: string) {
  //   return await this.subscriptionRepository.findOne({
  //     where: {
  //       user: { id: userId },
  //       status: SubscriptionStatus.ACTIVE,
  //     },
  //     select: { id: true, stripeCustomerId: true },
  //     relations: {
  //       user: true,
  //     },
  //   });
  // }

  private async updateAccountType(userId: string, status: SubscriptionStatus) {
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
          role: AccountRole.PREMIUM, // Keep access for grace period
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
    const activeOrPastDue: number =
      await this.countActiveOrPastDueByUserId(userId);
    const newRole =
      activeOrPastDue > 0 ? AccountRole.PREMIUM : AccountRole.FREE;

    return newRole;
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

  async countActiveOrPastDueByUserId(userId: string): Promise<number> {
    return await this.subscriptionRepository.count({
      where: {
        user: { id: userId },
        status: In([SubscriptionStatus.ACTIVE, SubscriptionStatus.PAST_DUE]),
      },
    });
  }

  async findOneByUserId(userId: string) {
    return await this.subscriptionRepository.findOne({
      where: {
        user: { id: userId },
      },
      select: { id: true, stripeCustomerId: true },
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
}
