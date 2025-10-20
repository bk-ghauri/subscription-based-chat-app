import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { SubscriptionStatus } from '../types/subscription-status.enum';

export class CreateSubscriptionDto {
  @IsNotEmpty()
  @IsString()
  stripeSubscriptionId: string;

  @IsNotEmpty()
  @IsString()
  stripeCustomerId: string;

  @IsNotEmpty()
  @IsEnum(SubscriptionStatus)
  status: SubscriptionStatus;

  @IsDate()
  @IsOptional()
  currentPeriodEnd?: Date | null;

  @IsUUID()
  @IsNotEmpty()
  userId: string;
}
