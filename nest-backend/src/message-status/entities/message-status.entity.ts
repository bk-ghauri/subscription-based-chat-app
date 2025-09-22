import {
  Entity,
  Column,
  ManyToOne,
  Index,
  PrimaryColumn,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Message } from '@app/messages/entities/message.entity';
import { User } from '@app/users/entities/user.entity';
import { MessageStatusEnum } from '../types/message-status.enum';
import { IsDate, IsEnum } from 'class-validator';
import { BaseEntity } from '@app/common/entities/base.entity';

@Unique(['messageId', 'receiverId'])
@Entity('message_statuses')
export class MessageStatus extends BaseEntity {
  @Column({ type: 'uuid', name: 'message_id' })
  messageId: string;

  @ManyToOne(() => Message, (message) => message.statuses, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'message_id' })
  message: Message;

  @Column({ type: 'uuid', name: 'receiver_id' })
  receiverId: string;

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
  deliveredAt: Date | null;

  @IsDate()
  @Column({ type: 'timestamp', nullable: true })
  readAt: Date | null;
}
