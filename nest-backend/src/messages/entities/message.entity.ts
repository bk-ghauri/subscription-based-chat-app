import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  DeleteDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from '@app/users/entities/user.entity';
import { Conversation } from '@app/conversations/entities/conversation.entity';
import { Attachment } from '@app/attachments/entities/attachment.entity';
import { MessageStatus } from '@app/message-status/entities/message-status.entity';
import {
  IsBoolean,
  IsDate,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Conversation, (conv) => conv.messages, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'conversation_id' })
  conversation: Conversation;

  @JoinColumn({ name: 'sender_id' })
  @ManyToOne(() => User, (user) => user.messages, { onDelete: 'SET NULL' })
  sender: User;

  @IsString()
  @IsOptional()
  @MaxLength(5000)
  @Column({ type: 'text', nullable: true })
  body: string | null;

  @IsDate()
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @IsBoolean()
  @Column({ default: false })
  isRemoved: boolean;

  @IsBoolean()
  @Column({ default: false })
  readByAll: boolean;

  @OneToMany(() => Attachment, (file) => file.message)
  attachments: Attachment[];

  @OneToMany(() => MessageStatus, (status) => status.message)
  statuses: MessageStatus[];
}
