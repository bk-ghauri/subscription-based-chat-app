import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
} from 'typeorm';
import { User } from '@app/users/entities/user.entity';
import { Message } from '@app/messages/entities/message.entity';
import { ConversationMember } from '@app/conversation-members/entities/conversation-member.entity';
import { ConversationTypeEnum } from '../types/conversation.enum';

@Entity()
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  conversation_id: string;

  @Column({ type: 'enum', enum: ConversationTypeEnum })
  type: string;

  @Column({ type: 'text', nullable: true })
  name: string | null; // optional, only for GROUP conversations

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @ManyToOne(() => User, { nullable: false })
  created_by: User;

  @OneToMany(() => Message, (msg) => msg.conversation)
  messages: Message[];

  @OneToMany(() => ConversationMember, (cm) => cm.conversation)
  members: ConversationMember[];
}
