import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  Unique,
  OneToOne,
  BeforeInsert,
} from 'typeorm';
import { Message } from '@app/messages/entities/message.entity';
import { Subscription } from '../../typeorm/entities/Subscription';
import { AccountType } from '../../typeorm/entities/AccountType';
import { Suspended } from '../../typeorm/entities/Suspended';
import { Attachment } from '../../typeorm/entities/Attachment';
import { ConversationMember } from '@app/conversation-members/entities/conversation-member.entity';

import * as bcrypt from 'bcrypt';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  user_id: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  google_id: string;

  @Column()
  password: string;

  @Column({ type: 'text', nullable: true })
  hashed_refresh_token: string | null;

  @Column({ unique: true, nullable: false })
  display_name: string;

  @Column({ nullable: true })
  avatar_url: string;

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

  @BeforeInsert()
  async hashPassword() {
    this.password = await bcrypt.hash(this.password, 10);
  }
}
