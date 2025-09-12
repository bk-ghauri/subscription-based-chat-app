import {
  Entity,
  Column,
  ManyToOne,
  Index,
  PrimaryColumn,
  JoinColumn,
} from 'typeorm';
import { Message } from '@app/messages/entities/message.entity';
import { User } from '@app/users/entities/user.entity';
import { MessageStatusEnum } from '../types/message-status.enum';
import { IsDate, IsEnum } from 'class-validator';

@Entity('message_status')
@Index(['message_id', 'receiver_id'], { unique: true }) // composite unique index (also serves as PK)
export class MessageStatus {
  @PrimaryColumn('uuid')
  message_id: string;

  @PrimaryColumn('uuid')
  receiver_id: string;

  @ManyToOne(() => Message, (message) => message.statuses, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'message_id' })
  message: Message;

  @ManyToOne(() => User, (user) => user.messageStatuses, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'receiver_id' })
  receiver: User;

  @Index()
  @IsEnum(MessageStatusEnum)
  @Column({
    type: 'enum',
    enum: MessageStatusEnum,
    default: MessageStatusEnum.SENT,
  })
  status: MessageStatusEnum;

  @IsDate()
  @Column({ type: 'timestamp', nullable: true })
  delivered_at: Date | null;

  @IsDate()
  @Column({ type: 'timestamp', nullable: true })
  read_at: Date | null;
}
