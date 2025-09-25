import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import stripeConfig from './config/stripe.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subscription } from './entities/subscription.entity';
import { StripeService } from './stripe.service';
import { SubscriptionsService } from './subscriptions.service';
import { UsersModule } from '@app/users/users.module';
import { SubscriptionsController } from './subscriptions.controller';
import { StripeWebhooksController } from './stripe-webhooks.controller';
import { AccountTypesModule } from '@app/account-types/account-types.module';

@Module({
  imports: [
    ConfigModule.forFeature(stripeConfig),
    TypeOrmModule.forFeature([Subscription]),
    UsersModule,
    AccountTypesModule,
  ],
  providers: [SubscriptionsService, StripeService],
  controllers: [SubscriptionsController, StripeWebhooksController],
})
export class SubscriptionsModule {}
