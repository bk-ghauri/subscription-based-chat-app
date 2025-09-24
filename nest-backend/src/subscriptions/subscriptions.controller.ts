import { JwtAuthGuard } from '@app/auth/utils/Guards';
import { Controller, Post, UseGuards } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { UserId } from '@app/common/decorators/user-id.decorator';

@UseGuards(JwtAuthGuard)
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionService: SubscriptionsService) {}

  //   @Post('checkout')
  //   async createCheckout(@UserId() userId: string) {
  //     return this.subscriptionService.createCheckoutSession(userId);
  //   }
}
