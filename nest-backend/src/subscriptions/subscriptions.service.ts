import { UsersService } from '@app/users/users.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Subscription } from './entities/subscription.entity';
import { Repository } from 'typeorm';
import { ErrorMessages } from '@app/common/strings/error-messages';
import { StripeService } from './stripe.service';
import { Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { SubscriptionStatus } from './types/subscription-status.enum';
import { AccountRole } from '@app/account-types/types/account-type.enum';
import { AccountTypesService } from '@app/account-types/account-types.service';

export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,

    private readonly stripeService: StripeService,
    private readonly userService: UsersService,
    private readonly accountTypeService: AccountTypesService,
  ) {}

  //   async createCheckoutSession(userId: string) {
  //     const user = await this.userService.findOne(userId);
  //     if (!user) {
  //       throw new Error(ErrorMessages.USER_NOT_FOUND);
  //     }

  //     // If user doesn’t have a Stripe customer ID yet, create one

  //     const userSubscription = await this.findOneByUserId(userId);

  //     if (!userSubscription) {
  //       const customer = await this.stripeService.client.customers.create({
  //         email: user.email,
  //         metadata: { userId: user.id },
  //       });
  //       const stripeCustomerId = customer.id;
  //     }

  //     // ⚠️ replace with your actual Price ID from Stripe Dashboard
  //     const priceId = process.env.STRIPE_PREMIUM_PRICE_ID;

  //     const session = await this.stripeService.client.checkout.sessions.create({
  //       customer: stripeCustomerId,
  //       mode: 'subscription',
  //       payment_method_types: ['card'],
  //       line_items: [{ price: priceId, quantity: 1 }],
  //       success_url: `${process.env.FRONTEND_URL}/subscription/success`,
  //       cancel_url: `${process.env.FRONTEND_URL}/subscription/cancel`,
  //     });

  //     return { url: session.url };
  //   }

  async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    this.logger.log(`Handling checkout.session.completed: ${session.id}`);

    const customerId = session.customer as string;
    const subscriptionId = session.subscription as string;

    // Stripe metadata: userId is set when you create the checkout session
    const userId = session.metadata?.userId;
    if (!userId) {
      this.logger.error('checkout.session.completed missing userId metadata');
      return;
    }

    // Find user
    const user = await this.userService.findOne(userId);
    if (!user) {
      this.logger.error(ErrorMessages.USER_NOT_FOUND);
      return;
    }

    // Check if subscription already exists
    let subscription = await this.subscriptionRepository.findOne({
      where: { stripeSubscriptionId: subscriptionId },
    });

    if (!subscription) {
      const dto: CreateSubscriptionDto = {
        stripeSubscriptionId: subscriptionId,
        stripeCustomerId: customerId,
        status: SubscriptionStatus.ACTIVE, // initial assumption, Stripe will confirm with invoice events
        currentPeriodEnd: null, // will be updated on invoice.succeeded
        userId: user.id,
      };
      subscription = this.subscriptionRepository.create({ ...dto, user });
    }

    await this.subscriptionRepository.save(subscription);

    // Mark user as PREMIUM

    await this.accountTypeService.updateOne({
      userId: user.id,
      role: AccountRole.PREMIUM,
    });

    this.logger.log(
      `✅ Subscription linked: user=${user.id} subscription=${subscriptionId}`,
    );
  }

  async findOneByUserId(userId: string) {
    return await this.subscriptionRepository.findOne({
      where: {
        user: { id: userId },
      },
      select: { stripeCustomerId: true },
      relations: {
        user: true,
      },
    });
  }
}
