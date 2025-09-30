import {
  Controller,
  Post,
  Headers,
  Res,
  HttpCode,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { StripeService } from './stripe.service';
import Stripe from 'stripe';
import { SubscriptionsService } from './stripe-webhooks.service';
import { RawBody } from './decorators/raw-body.decorator';

@Controller('webhooks/stripe')
export class StripeWebhooksController {
  private readonly logger = new Logger(StripeWebhooksController.name);

  constructor(
    private readonly stripeService: StripeService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  @Post()
  @HttpCode(200)
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @RawBody() rawBody: Buffer,
    @Res() res: Response,
  ) {
    const webhookSecret = this.stripeService.getWebhookSecret();

    if (!signature || !webhookSecret) {
      this.logger.error('Missing Stripe signature or webhook secret');
      return res.status(400).send('Webhook signature missing');
    }

    let event: Stripe.Event;
    try {
      event = this.stripeService.client.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret,
      );
    } catch (err: any) {
      this.logger.warn(`Stripe signature verification failed: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    this.logger.log(`Verified event: ${event.type}`);

    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await this.subscriptionsService.handleCheckoutCompleted(
            event.data.object as Stripe.Checkout.Session,
          );
          break;

        case 'invoice.payment_succeeded':
          await this.subscriptionsService.handleInvoiceSucceeded(
            event.data.object as Stripe.Invoice,
          );
          break;

        case 'invoice.payment_failed':
          await this.subscriptionsService.handleInvoiceFailed(
            event.data.object as Stripe.Invoice,
          );
          break;

        case 'customer.subscription.updated':
          await this.subscriptionsService.handleSubscriptionUpdated(
            event.data.object as Stripe.Subscription,
          );
          break;

        case 'customer.subscription.deleted':
          await this.subscriptionsService.handleSubscriptionDeleted(
            event.data.object as Stripe.Subscription,
          );
          break;

        default:
          this.logger.debug(`Unhandled event type: ${event.type}`);
      }
    } catch (err: any) {
      this.logger.error(
        `Error handling event ${event.type}: ${err.message}`,
        err.stack,
      );
      return res.status(500).send('Webhook handler error');
    }

    return res.json({ received: true });
  }
}
