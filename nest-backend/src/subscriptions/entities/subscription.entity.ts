import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { IsDate, IsEnum, IsOptional, IsString, Length } from 'class-validator';
import { SubscriptionStatus } from '../types/subscription-status.enum';

@Entity()
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  stripe_subscription_id: string;

  @Column({ type: 'varchar', length: 255 })
  @IsString()
  @Length(5, 255)
  stripe_customer_id: string;

  @Column({ type: 'enum', enum: SubscriptionStatus })
  @IsEnum(SubscriptionStatus)
  status: string;

  @IsDate()
  @IsOptional()
  @Column({ type: 'timestamp', nullable: true })
  current_period_end: Date;

  @ManyToOne(() => User, (user) => user.subscriptions, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  user: User;
}
