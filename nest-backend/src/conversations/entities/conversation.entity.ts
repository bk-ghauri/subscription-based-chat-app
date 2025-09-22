import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '@app/users/entities/user.entity';
import { Message } from '@app/messages/entities/message.entity';
import { ConversationMember } from '@app/conversation-members/entities/conversation-member.entity';
import { ConversationTypeEnum } from '../types/conversation.enum';
import {
  IsDate,
  IsEnum,
  IsOptional,
  IsString,
  Length,
  MinLength,
} from 'class-validator';
import { BaseEntity } from '@app/common/entities/base.entity';
import { MaxTextLength } from '@app/common/validators/max-text-length';

@Entity('conversations')
export class Conversation extends BaseEntity {
  @Column({ type: 'enum', enum: ConversationTypeEnum })
  @IsEnum(ConversationTypeEnum)
  type: string;

  // Only for GROUP conversations
  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxTextLength(100)
  name: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by' })
  createdBy: User | null;

  @OneToMany(() => Message, (msg) => msg.conversation)
  messages: Message[];

  @OneToMany(() => ConversationMember, (cm) => cm.conversation)
  members: ConversationMember[];
}
