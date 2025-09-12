import { Entity, Column, OneToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { IsDate, IsString, IsNotEmpty, Length } from 'class-validator';

@Entity('suspended')
export class Suspended {
  @PrimaryColumn('uuid')
  banned_user: string; // FK, same as user_id

  @OneToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'banned_user' })
  user: User;

  @IsDate()
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  ban_start: Date;

  @IsDate()
  @Column({ type: 'timestamp' })
  ban_end: Date;

  @Column({ type: 'varchar', length: 255 })
  @IsString()
  @IsNotEmpty()
  @Length(5, 255)
  ban_reason: string;
}
