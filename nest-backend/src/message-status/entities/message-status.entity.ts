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
import { IsEnum } from 'class-validator';

@Entity('message_status')
@Index(['messageId', 'receiverId'], { unique: true }) // composite unique index (also serves as PK)
export class MessageStatus {
  @PrimaryColumn('uuid')
  message_id: string;

  @PrimaryColumn('uuid')
  receiver_id: string;

  @ManyToOne(() => Message, (message) => message.statuses, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'message_id' })
  message: Message;

  @ManyToOne(() => User, (user) => user.messageStatuses, {
    onDelete: 'CASCADE',
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

  @Column({ type: 'timestamp', nullable: true })
  delivered_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  read_at: Date | null;
}
