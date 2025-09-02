import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from './User';

@Entity()
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  refresh_token_id: string;

  @Column()
  token_hash: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp' })
  expires_at: Date;

  @ManyToOne(() => User, (user) => user.refreshTokens, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  user: User;
}
