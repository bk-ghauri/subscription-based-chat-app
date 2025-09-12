import { Entity, PrimaryColumn, ManyToOne, Column, JoinColumn } from 'typeorm';
import { User } from '@app/users/entities/user.entity';
import { Conversation } from '@app/conversations/entities/conversation.entity';
import { ConversationRole } from '../types/conversation-member.enum';
import { IsEnum } from 'class-validator';

@Entity()
export class ConversationMember {
  @PrimaryColumn('uuid')
  conversation_id: string;

  @ManyToOne(() => Conversation, (conv) => conv.members, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'conversation_id' })
  conversation: Conversation;

  @PrimaryColumn('uuid')
  user_id: string;

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
  conversation_role: string;
}
