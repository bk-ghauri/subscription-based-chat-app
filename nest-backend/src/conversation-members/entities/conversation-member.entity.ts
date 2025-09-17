import { Entity, PrimaryColumn, ManyToOne, Column, JoinColumn } from 'typeorm';
import { User } from '@app/users/entities/user.entity';
import { Conversation } from '@app/conversations/entities/conversation.entity';
import { ConversationRole } from '../types/conversation-member.enum';
import { IsEnum } from 'class-validator';

@Entity('conversation_members')
export class ConversationMember {
  @PrimaryColumn({ type: 'uuid', name: 'conversation_id' })
  conversationId: string;

  @ManyToOne(() => Conversation, (conv) => conv.members, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'conversation_id' })
  conversation: Conversation;

  @PrimaryColumn({ type: 'uuid', name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, (user) => user.conversations, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @IsEnum(ConversationRole)
  @Column({
    type: 'enum',
    enum: ConversationRole,
    default: ConversationRole.MEMBER,
  })
  conversationRole: string;
}
