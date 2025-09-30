import { JwtAuthGuard } from '@app/auth/utils/Guards';
import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { SubscriptionsService } from './stripe-webhooks.service';
import { UserId } from '@app/common/decorators/user-id.decorator';
import { Public } from '@app/auth/decorators/public.decorator';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOperation,
} from '@nestjs/swagger';

@UseGuards(JwtAuthGuard)
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionService: SubscriptionsService) {}

  @Post('checkout')
  @ApiOperation({ summary: 'Create a Stripe checkout session' })
  @ApiCreatedResponse({ description: 'Checkout session created' })
  @ApiBearerAuth()
  async createCheckout(@UserId() userId: string) {
    return this.subscriptionService.createCheckoutSession(userId);
  }

  @Post('billing-portal')
  @ApiOperation({ summary: 'Create a Stripe billing portal session' })
  @ApiCreatedResponse({ description: 'Billing portal session created' })
  @ApiBearerAuth()
  async createBillingPortal(@UserId() userId: string) {
    return await this.subscriptionService.createBillingPortalSession(userId);
  }

  // Placeholder endpoints (to be replaced on front-end creation)
  @Public()
  @Get('success')
  handleSuccess() {
    return { message: 'Payment success!' };
  }

  @Public()
  @Get('cancel')
  handleCancel() {
    return { message: 'Payment cancelled!' };
  }
}
