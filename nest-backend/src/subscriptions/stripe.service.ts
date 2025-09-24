import { Injectable, Inject } from '@nestjs/common';
import * as config from '@nestjs/config';
import stripeConfig from './config/stripe.config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  public readonly client: Stripe;

  constructor(
    @Inject(stripeConfig.KEY)
    private readonly stripesubscriptionconfig: config.ConfigType<
      typeof stripeConfig
    >,
  ) {
    this.client = new Stripe(this.stripesubscriptionconfig.secretKey!, {});
  }

  getWebhookSecret(): string {
    return this.stripesubscriptionconfig.webhookSecret!;
  }
}
