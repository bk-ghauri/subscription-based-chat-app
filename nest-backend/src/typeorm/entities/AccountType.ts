import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { User } from './User';

@Entity('account_types')
export class AccountType {
  @PrimaryColumn('uuid')
  user_id: string; // FK to User

  @OneToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: ['FREE', 'PREMIUM', 'ADMIN'],
    default: 'FREE',
  })
  role: string;
}
