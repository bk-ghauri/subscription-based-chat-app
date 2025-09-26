import { Injectable, Inject } from '@nestjs/common';
import * as config from '@nestjs/config';
import stripeConfig from './config/stripe.config';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StripeService {
  public readonly client: Stripe;

  constructor(
    @Inject(stripeConfig.KEY)
    private readonly stripesubscriptionconfig: config.ConfigType<
      typeof stripeConfig
    >,
    private configService: ConfigService,
  ) {
    this.client = new Stripe(this.stripesubscriptionconfig.secretKey!, {
      apiVersion: '2025-08-27.basil',
    });
  }

  getWebhookSecret(): string {
    return this.stripesubscriptionconfig.webhookSecret!;
  }

  getPriceId(): string {
    return this.configService.get<string>('STRIPE_PREMIUM_PRICE_ID')!;
  }

  async createSessionForNewCustomer(userId: string, email: string) {
    const priceId = this.getPriceId();

    const session = await this.client.checkout.sessions.create({
      customer_email: email,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: 'http://localhost:3000/subscriptions/success',
      cancel_url: 'http://localhost:3000/subscriptions/cancel',
      metadata: { userId },
      subscription_data: {
        metadata: { userId }, // we need this for handling invoice webhooks
      },
    });

    return { url: session.url };
  }

  async createSessionForExistingCustomer(
    userId: string,
    stripeCustomerId: string,
  ) {
    const priceId = this.getPriceId();

    const session = await this.client.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: 'http://localhost:3000/subscriptions/success',
      cancel_url: 'http://localhost:3000/subscriptions/cancel',
      metadata: { userId },
      subscription_data: {
        metadata: { userId }, // we need this for handling invoice webhooks
      },
    });

    return { url: session.url };
  }
}
