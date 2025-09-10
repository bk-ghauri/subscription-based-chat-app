import { Entity, PrimaryColumn, ManyToOne, Column } from 'typeorm';
import { User } from '@app/users/entities/User';
import { Conversation } from '@app/conversations/entities/conversation.entity';

@Entity()
export class ConversationMember {
  @PrimaryColumn('uuid')
  conversation_id: string;
  @ManyToOne(() => Conversation, (conv) => conv.members, {
    onDelete: 'CASCADE',
  })
  conversation: Conversation;

  @PrimaryColumn('uuid')
  user_id: string;
  @ManyToOne(() => User, (user) => user.conversations, { onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'enum', enum: ['ADMIN', 'MEMBER'], default: 'MEMBER' })
  conversation_role: string;

  @Column({ nullable: true })
  status_message: string;
}
