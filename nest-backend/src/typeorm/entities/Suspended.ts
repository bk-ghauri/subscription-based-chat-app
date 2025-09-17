import { Entity, Column, OneToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { User } from './User';

@Entity('suspended')
export class Suspended {
  @PrimaryColumn('uuid')
  banned_user: string; // FK, same as user_id

  @OneToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'banned_user' })
  user: User;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  ban_start: Date;

  @Column({ type: 'timestamp' })
  ban_end: Date;

  @Column()
  ban_reason: string;
}
