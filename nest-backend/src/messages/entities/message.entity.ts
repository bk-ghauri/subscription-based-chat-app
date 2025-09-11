import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  DeleteDateColumn,
} from 'typeorm';
import { User } from '@app/users/entities/user.entity';
import { Conversation } from '@app/conversations/entities/conversation.entity';
import { Attachment } from '@app/common/entities/Attachment';
import { MessageStatus } from '@app/message-status/entities/message-status.entity';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

@Entity()
export class Message {
  @PrimaryGeneratedColumn('uuid')
  message_id: string;

  @ManyToOne(() => Conversation, (conv) => conv.messages, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  conversation: Conversation;

  @ManyToOne(() => User, (user) => user.messages, { onDelete: 'SET NULL' })
  sender: User;

  @IsString()
  @IsOptional()
  @MaxLength(5000)
  @Column({ type: 'text', nullable: true })
  body: string | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @DeleteDateColumn()
  deleted_at: Date;

  @IsBoolean()
  @Column({ default: false })
  is_removed: boolean;

  @IsBoolean()
  @Column({ default: false })
  read_by_all: boolean;

  @OneToMany(() => Attachment, (file) => file.message)
  attachments: Attachment[];

  @OneToMany(() => MessageStatus, (status) => status.message)
  statuses: MessageStatus[];
}
