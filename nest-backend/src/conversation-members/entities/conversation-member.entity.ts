import { Entity, PrimaryColumn, ManyToOne, Column, JoinColumn } from 'typeorm';
import { User } from '@app/users/entities/user.entity';
import { Conversation } from '@app/conversations/entities/conversation.entity';
import { ConversationRole } from '../types/conversation-member.enum';

@Entity()
export class ConversationMember {
  @PrimaryColumn('uuid')
  conversation_id: string;

  @ManyToOne(() => Conversation, (conv) => conv.members, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'conversation_id' })
  conversation: Conversation;

  @PrimaryColumn('uuid')
  user_id: string;

  @ManyToOne(() => User, (user) => user.conversations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: ConversationRole,
    default: ConversationRole.MEMBER,
  })
  conversation_role: string;
}
