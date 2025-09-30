import { Entity, Column, OneToOne, JoinColumn, Unique } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { AccountRole } from '../types/account-role.enum';
import { IsEnum } from 'class-validator';
import { BaseEntity } from '@app/common/entities/base.entity';

@Entity('account_types')
export class AccountType extends BaseEntity {
  @Column({ type: 'uuid', name: 'user_id' })
  userId: string; // FK to User

  @OneToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @IsEnum(AccountRole)
  @Column({
    type: 'enum',
    enum: AccountRole,
    default: AccountRole.FREE,
  })
  role: string;
}
