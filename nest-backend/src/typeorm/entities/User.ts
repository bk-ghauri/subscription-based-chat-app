import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  Unique,
  OneToOne,
  BeforeInsert,
} from 'typeorm';
import { Message } from './Message';
import { Subscription } from './Subscription';
import { RefreshToken } from './RefreshToken';
import { AccountType } from './AccountType';
import { Suspended } from './Suspended';
import { Attachment } from './Attachment';
import { ConversationMember } from './ConversationMember';

import * as bcrypt from 'bcrypt';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  user_id: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  google_id: string;

  @Column({ nullable: true })
  password: string;

  @Column({ nullable: true })
  hashed_refresh_token: string;

  @Column()
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
