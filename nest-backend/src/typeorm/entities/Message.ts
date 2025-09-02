import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { User } from './User';
import { Conversation } from './Conversation';
import { Attachment } from './Attachment';

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

  @Column({ type: 'text', nullable: true })
  body: string | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  deleted_at: Date;

  @Column({
    type: 'enum',
    enum: ['SENT', 'DELIVERED', 'READ'],
    default: 'SENT',
  })
  message_status: string;

  @Column({ default: false })
  is_removed: boolean;

  @OneToMany(() => Attachment, (file) => file.message)
  attachments: Attachment[];
}
