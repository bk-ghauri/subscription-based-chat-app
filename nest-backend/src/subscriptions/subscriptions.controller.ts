import { JwtAuthGuard } from '@app/auth/utils/Guards';
import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { UserId } from '@app/common/decorators/user-id.decorator';
import { Public } from '@app/auth/decorators/public.decorator';

@UseGuards(JwtAuthGuard)
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionService: SubscriptionsService) {}

  @Post('checkout')
  async createCheckout(@UserId() userId: string) {
    return this.subscriptionService.createCheckoutSession(userId);
  }

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
