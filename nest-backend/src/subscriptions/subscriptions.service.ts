import { UsersService } from '@app/users/users.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Subscription } from './entities/subscription.entity';
import { Repository } from 'typeorm';
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

    // Get all subscriptions of this user from DB
    const subscriptions = await this.subscriptionRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' }, // latestSubscription first if you want
    });

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

    const stripeCustomerId = session.customer as string;
    const stripeSubscriptionId = session.subscription as string;

    // Stripe metadata: userId is set when you create the checkout session
    const userId = session.metadata?.userId;
    if (!userId) {
      this.logger.error('checkout.session.completed missing userId metadata');
      return;
    }

    return await this.activateSubscription(
      userId,
      stripeCustomerId,
      stripeSubscriptionId,
    );
  }

  async activateSubscription(
    userId: string,
    stripeCustomerId: string,
    stripeSubscriptionId: string,
  ) {
    const user = await this.userService.findOne(userId);
    if (!user) throw new Error('User not found');

    const stripeSubscription =
      await this.stripeService.client.subscriptions.retrieve(
        stripeSubscriptionId,
      );

    const currentPeriodEnd = new Date(
      stripeSubscription.items.data[0].current_period_end * 1000, //Convert Unix time (seconds) to Date (milliseconds)
    );

    // Check if stripeCustomerId exists for user
    const userSubscription = await this.findOneByUserId(userId);
    if (!userSubscription) {
      // Save subscription
      const subscription: CreateSubscriptionDto = {
        userId,
        stripeCustomerId,
        stripeSubscriptionId,
        currentPeriodEnd: null, // Not set until invoice.payment_succeeded webhook
        status: SubscriptionStatus.PAST_DUE, // Default until invoice.payment_succeeded webhook
      };

      const savedSubscription = await this.subscriptionRepository.save(
        this.subscriptionRepository.create({ ...subscription, user }),
      );

      return savedSubscription;
    }
  }

  async handleInvoiceSucceeded(invoice: Stripe.Invoice) {
    this.logger.log(`Handling invoice.payment_succeeded: ${invoice.id}`);

    const stripeSubscriptionId =
      invoice.parent?.subscription_details?.subscription;

    if (!stripeSubscriptionId) {
      this.logger.warn('Invoice has no subscription ID');
      return;
    }

    const subscription = await this.findOneByStripeSubscriptionId(
      stripeSubscriptionId as string,
    );

    if (!subscription) {
      const stripeCustomerId = invoice.customer as string;
      const stripeSubscriptionId = invoice.parent?.subscription_details
        ?.subscription as string;

      // Get the subscription from Stripe (to read metadata)
      const stripeSubscription =
        await this.stripeService.client.subscriptions.retrieve(
          stripeSubscriptionId,
        );

      const userId = stripeSubscription.metadata?.userId; // ✅ comes from checkout.session metadata

      if (!userId) {
        this.logger.error(
          `No userId metadata found for subscription ${stripeSubscriptionId}`,
        );
        return;
      }
    }

    // Update current_period_end from Stripe invoice
    const currentPeriodEnd = new Date(
      invoice.lines.data[0].period.end * 1000, // Convert Unix time (seconds) to Date (milliseconds)
    );

    const updateDto: UpdateSubscriptionDto = {
      status: SubscriptionStatus.ACTIVE,
      currentPeriodEnd,
    };

    await this.subscriptionRepository.update(
      { stripeSubscriptionId: stripeSubscriptionId as string },
      updateDto,
    );
    this.logger.log(`Subscription ${stripeSubscriptionId} marked ACTIVE`);

    await this.accountTypeService.updateOne({
      userId: subscription.user.id,
      role: AccountRole.PREMIUM,
    });
  }

  async handleInvoiceFailed(invoice: Stripe.Invoice) {
    this.logger.warn(`Handling invoice.payment_failed: ${invoice.id}`);

    const stripeSubscriptionId =
      invoice.parent?.subscription_details?.subscription;

    if (!stripeSubscriptionId) {
      this.logger.warn('Invoice has no subscription ID');
      return;
    }
    const subscription = await this.findOneByStripeSubscriptionId(
      stripeSubscriptionId as string,
    );

    if (!subscription) {
      this.logger.error('Subscription not found');
      return;
    }

    const updateDto: UpdateSubscriptionDto = {
      status: SubscriptionStatus.PAST_DUE,
    };

    await this.subscriptionRepository.update(
      { stripeSubscriptionId: stripeSubscriptionId as string },
      updateDto,
    );
    this.logger.log(`Subscription ${stripeSubscriptionId} marked PAST_DUE`);
  }

  async findActiveSubscriptionByUserId(userId: string) {
    return await this.subscriptionRepository.findOne({
      where: {
        user: { id: userId },
        status: SubscriptionStatus.ACTIVE,
      },
      select: { id: true, stripeCustomerId: true },
      relations: {
        user: true,
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
