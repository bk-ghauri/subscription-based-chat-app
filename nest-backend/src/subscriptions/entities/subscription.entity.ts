import { Entity, Column, ManyToOne, Unique, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { IsDate, IsEnum, IsOptional, IsString, Length } from 'class-validator';
import { SubscriptionStatus } from '../types/subscription-status.enum';
import { BaseEntity } from '@app/common/entities/base.entity';

@Unique(['stripeSubscriptionId'])
@Entity('subscriptions')
export class Subscription extends BaseEntity {
  @Column({ name: 'stripe_subscription_id' })
  stripeSubscriptionId: string;

  @Column({ type: 'varchar', length: 255 })
  @IsString()
  @Length(5, 255)
  stripeCustomerId: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'enum', enum: SubscriptionStatus })
  @IsEnum(SubscriptionStatus)
  status: string;

  @IsDate()
  @IsOptional()
  @Column({ type: 'timestamp', nullable: true })
  currentPeriodEnd: Date;

  @ManyToOne(() => User, (user) => user.subscriptions, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
