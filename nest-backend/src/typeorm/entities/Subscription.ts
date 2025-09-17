import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from './User';

@Entity()
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  stripe_subscription_id: string;

  @Column()
  stripe_customer_id: string;

  @Column({ type: 'enum', enum: ['ACTIVE', 'CANCELED', 'PAST_DUE'] })
  status: string;

  @Column({ type: 'timestamp', nullable: true })
  current_period_end: Date;

  @ManyToOne(() => User, (user) => user.subscriptions, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  user: User;
}
