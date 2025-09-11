import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  Unique,
  OneToOne,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { Message } from '@app/messages/entities/message.entity';
import { Subscription } from '../../common/entities/Subscription';
import { AccountType } from '@app/account-type/entities/account-type.entity';
import { Suspended } from '../../common/entities/Suspended';
import { Attachment } from '../../common/entities/Attachment';
import { ConversationMember } from '@app/conversation-members/entities/conversation-member.entity';

import * as bcrypt from 'bcrypt';
import { MessageStatus } from '@app/message-status/entities/message-status.entity';
import {
  IsEmail,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  MaxLength,
  MinLength,
} from 'class-validator';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  user_id: string;

  @IsEmail()
  @MaxLength(320)
  @Column({ unique: true, length: 320 })
  email: string;

  @IsString()
  @MinLength(60) // bcrypt hashed length baseline (guard)
  @Column()
  password: string;

  @IsString()
  @MaxLength(1024)
  @Column({ type: 'text' })
  hashed_refresh_token: string;

  @IsString()
  @Length(3, 50)
  @Column({ nullable: false, unique: true, length: 50 })
  display_name: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(2048)
  @Column({ nullable: true, length: 2048 })
  avatar_url: string | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @OneToMany(() => Subscription, (sub) => sub.user)
  subscriptions: Subscription[];

  @OneToMany(() => Message, (msg) => msg.sender)
  messages: Message[];

  @OneToMany(() => Attachment, (file) => file.uploader_id)
  attachments: Attachment[];

  @OneToMany(() => ConversationMember, (cm) => cm.user)
  conversations: ConversationMember[];

  @OneToOne(() => AccountType, (accountType) => accountType.user)
  accountType: AccountType;

  @OneToOne(() => Suspended, (suspended) => suspended.user)
  suspended: Suspended;

  @OneToMany(() => MessageStatus, (status) => status.receiver)
  messageStatuses: MessageStatus[];

  @BeforeUpdate()
  @BeforeInsert()
  async hashPassword() {
    this.password = await bcrypt.hash(this.password, 10);
  }
}
