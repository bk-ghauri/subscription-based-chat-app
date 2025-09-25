import { Controller, Post, Req, Res, HttpCode, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';
import { StripeService } from './stripe.service';
import Stripe from 'stripe';
import { SubscriptionsService } from './subscriptions.service';

@Controller('webhooks/stripe')
export class StripeWebhooksController {
  private readonly logger = new Logger(StripeWebhooksController.name);

  constructor(
    private readonly stripeService: StripeService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  @Post()
  @HttpCode(200)
  async handleWebhook(@Req() req: Request, @Res() res: Response) {
    const signature = req.headers['stripe-signature'] as string | undefined;
    const webhookSecret = this.stripeService.getWebhookSecret();

    if (!signature || !webhookSecret) {
      this.logger.error('Missing Stripe signature or webhook secret');
      return res.status(400).send('Webhook signature missing');
    }

    let event: Stripe.Event;
    try {
      event = this.stripeService.client.webhooks.constructEvent(
        req.body as Buffer,
        signature,
        webhookSecret,
      );
    } catch (err: any) {
      this.logger.warn(`Stripe signature verification failed: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    this.logger.log(`✅ Verified event: ${event.type}`);

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
