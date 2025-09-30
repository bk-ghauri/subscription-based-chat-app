import {
  Entity,
  Column,
  OneToMany,
  Unique,
  OneToOne,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { Message } from '@app/messages/entities/message.entity';
import { Subscription } from '../../subscriptions/entities/subscription.entity';
import { AccountType } from '@app/account-types/entities/account-type.entity';
import { Suspended } from '@app/suspended/entities/suspended.entity';
import { Attachment } from '../../attachments/entities/attachment.entity';
import { ConversationMember } from '@app/conversation-members/entities/conversation-member.entity';
import * as bcrypt from 'bcrypt';
import { MessageStatus } from '@app/message-status/entities/message-status.entity';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  MaxLength,
  MinLength,
} from 'class-validator';
import { BaseEntity } from '@app/common/entities/base.entity';

@Unique(['email'])
@Entity('users')
export class User extends BaseEntity {
  @IsEmail()
  @MaxLength(320)
  @Column({ nullable: false, unique: true, length: 320 })
  email: string;

  @IsString()
  @MinLength(60) // bcrypt hashed length baseline (guard)
  @Column({ select: false })
  password: string;

  @IsOptional()
  @IsString()
  @MinLength(44)
  @Column({ type: 'text', nullable: true, select: false })
  hashedRefreshToken: string | null;

  @IsNotEmpty()
  @IsString()
  @Length(3, 50)
  @Column({ nullable: false, unique: true, length: 50 })
  displayName: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(2048)
  @Column({ type: 'varchar', nullable: true, length: 2048 })
  avatarUrl: string | null;

  @OneToMany(() => Subscription, (sub) => sub.user)
  subscriptions: Subscription[];

  @OneToMany(() => Message, (msg) => msg.sender)
  messages: Message[];

  @OneToMany(() => Attachment, (file) => file.uploader)
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
