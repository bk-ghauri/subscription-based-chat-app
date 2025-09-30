import { Entity, Column, OneToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { IsString, IsNotEmpty } from 'class-validator';
import { BaseEntity } from '@app/common/entities/base.entity';
import { MaxTextLength } from '@app/common/validators/max-text-length';

@Entity('suspendeds')
export class Suspended extends BaseEntity {
  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @OneToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 255, nullable: false })
  @IsString()
  @IsNotEmpty()
  @MaxTextLength(255)
  banReason: string;
}
