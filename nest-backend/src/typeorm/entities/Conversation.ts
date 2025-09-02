import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
} from 'typeorm';
import { User } from './User';
import { Message } from './Message';
import { ConversationMember } from './ConversationMember';

@Entity()
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  conversation_id: string;

  @Column({ type: 'enum', enum: ['PRIVATE', 'GROUP'] })
  type: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @ManyToOne(() => User, { nullable: false })
  created_by: User;

  @OneToMany(() => Message, (msg) => msg.conversation)
  messages: Message[];

  @OneToMany(() => ConversationMember, (cm) => cm.conversation)
  members: ConversationMember[];
}
