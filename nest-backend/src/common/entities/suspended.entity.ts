import { Entity, Column, OneToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { IsDate, IsString, IsNotEmpty, Length } from 'class-validator';

@Entity('suspendeds')
export class Suspended {
  @PrimaryColumn('uuid')
  userId: string; // FK, same as user_id

  @OneToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @IsDate()
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  banStart: Date;

  @IsDate()
  @Column({ type: 'timestamp' })
  banEnd: Date;

  @Column({ type: 'varchar', length: 255 })
  @IsString()
  @IsNotEmpty()
  @Length(5, 255)
  banReason: string;
}
