import { UsersService } from '@app/users/users.service';
import { ErrorMessages } from '@app/common/strings/error-messages';
import { StripeService } from './stripe.service';
import { Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { SubscriptionStatus } from './types/subscription-status.enum';
import { SuccessMessages } from '@app/common/strings/success-messages';
import { SubscriptionsService } from './subscriptions.service';

export class StripeWebhooksService {
  private readonly logger = new Logger(StripeWebhooksService.name);

  constructor(
    private readonly stripeService: StripeService,
    private readonly userService: UsersService,
    private readonly subscriptionService: SubscriptionsService,
  ) {}

  async createCheckoutSession(userId: string) {
    const user = await this.userService.findOne(userId);
    if (!user) {
      throw new Error(ErrorMessages.USER_NOT_FOUND);
    }

    // Get all subscriptions of this user from DB in descending order of creation date
    const subscriptions =
      await this.subscriptionService.findAllByUserId(userId);

    // If no subscriptions exist, create new customer using email
    if (subscriptions.length === 0) {
      return this.stripeService.createSessionForNewCustomer(userId, user.email);
    }

    // Check the most recent subscription status
    const latestSubscription = subscriptions[0];

    if (latestSubscription.status === SubscriptionStatus.ACTIVE) {
      return { success: true, message: 'Already subscribed' };
    }

    if (latestSubscription.status === SubscriptionStatus.PAST_DUE) {
      // Redirect to billing portal
      return this.stripeService.createBillingPortalSession(
        latestSubscription.stripeCustomerId,
      );
    }

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
      await this.subscriptionService.findOneByStripeSubscriptionId(
        stripeSubscriptionId,
      );

    if (existingSubscription) {
      return { message: SuccessMessages.SUBSCRIPTION_EXISTS };
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

    return await this.subscriptionService.insertOneIfNotExists(newSubscription);
  }

  async createBillingPortalSession(userId: string) {
    const subscription = await this.subscriptionService.findOneByUserId(userId);
    if (!subscription || !subscription.stripeCustomerId) {
      return {
        success: false,
        message: ErrorMessages.NO_BILLING_PORTAL,
      };
    }

    const url = await this.stripeService.createBillingPortalSession(
      subscription.stripeCustomerId,
    );
    return {
      success: true,
      url,
    };
  }

  async handleInvoiceSucceeded(invoice: Stripe.Invoice) {
    this.logger.log(`Handling invoice.payment_succeeded: ${invoice.id}`);

    const stripeSubscriptionId = invoice.parent?.subscription_details
      ?.subscription as string;

    if (!stripeSubscriptionId) {
      this.logger.error('Invoice has no subscription ID');
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

    // Update current_period_end from Stripe invoice
    const currentPeriodEnd = new Date(
      invoice.lines.data[0].period.end * 1000, // Convert Unix time (seconds) to Date (milliseconds)
    );

    const newSubscription =
      await this.subscriptionService.UpdateorInsertSubscription({
        userId,
        stripeCustomerId,
        stripeSubscriptionId,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodEnd,
      });

    await this.subscriptionService.updateAccountType(
      userId,
      SubscriptionStatus.ACTIVE,
    );

    this.logger.log(`Subscription ${stripeSubscriptionId} marked ACTIVE`);
    return newSubscription;
  }

  async handleInvoiceFailed(invoice: Stripe.Invoice) {
    this.logger.warn(`Handling invoice.payment_failed: ${invoice.id}`);

    const stripeSubscriptionId = invoice.parent?.subscription_details
      ?.subscription as string;

    if (!stripeSubscriptionId) {
      this.logger.warn('Invoice has no subscription ID');
      return;
    }

    const userId = invoice.parent?.subscription_details?.metadata?.userId; // comes from checkout.session.subscription_data metadata

    if (!userId) {
      this.logger.error(
        `No userId metadata found for subscription ${stripeSubscriptionId}`,
      );
      return;
    }

    // Wait for subscription.status.updated webhook to update subscription status, but revoke premium rights
    await this.subscriptionService.updateAccountType(
      userId,
      SubscriptionStatus.PAST_DUE,
    );
    return;
  }

  async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    this.logger.log(
      `Handling customer.subscription.updated: ${subscription.id}`,
    );

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
      paused: SubscriptionStatus.PAST_DUE,
    };

    const status =
      statusMap[subscription.status] ?? SubscriptionStatus.PAST_DUE;

    await this.subscriptionService.UpdateorInsertSubscription({
      stripeSubscriptionId,
      stripeCustomerId,
      userId,
      status,
      currentPeriodEnd,
    });

    await this.subscriptionService.updateAccountType(userId, status);

    this.logger.log(
      `Subscription ${stripeSubscriptionId} updated -> ${status}, periodEnd: ${currentPeriodEnd}`,
    );

    return;
  }

  async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    this.logger.log(
      `Handling customer.subscription.deleted: ${subscription.id}`,
    );

    const stripeSubscriptionId = subscription.id as string;
    const userId = subscription.metadata.userId as string;

    const existingSubscription =
      await this.subscriptionService.findOneByStripeSubscriptionId(
        stripeSubscriptionId,
      );
    if (!existingSubscription) {
      this.logger.warn(
        `Subscription ${stripeSubscriptionId} deleted on Stripe, but not found in DB.`,
      );
      return;
    }

    await this.subscriptionService.updateOneByStripeSubscriptionId({
      stripeSubscriptionId,
      status: SubscriptionStatus.CANCELED,
      currentPeriodEnd: null,
    });

    // Check if no other subscriptions exist, then set account role to FREE
    await this.subscriptionService.updateAccountType(
      userId,
      SubscriptionStatus.CANCELED,
    );

    this.logger.log(
      `Subscription ${stripeSubscriptionId} marked as CANCELED in DB.`,
    );
    return;
  }
}
