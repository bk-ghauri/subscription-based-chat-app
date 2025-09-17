import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Conversation } from '../../typeorm/entities/Conversation';
import { User } from '../../typeorm/entities/User';
import { Attachment } from '../../typeorm/entities/Attachment';

@Entity()
export class Message {
  @PrimaryGeneratedColumn('uuid')
  message_id: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  //   @Column({ type: 'timestamp', nullable: true })
  //   deleted_at: Date;

  //   @Column({
  //     type: 'enum',
  //     enum: ['SENT', 'DELIVERED', 'READ'],
  //     default: 'SENT',
  //   })
  //   message_status: string;

  //   @Column({ default: false })
  //   is_removed: boolean;

  @ManyToOne(() => Conversation, (conv) => conv.messages, {
    onDelete: 'CASCADE',
  })
  conversation: Conversation;

  @ManyToOne(() => User, (user) => user.messages, { onDelete: 'CASCADE' })
  sender: User;

  @OneToMany(() => Attachment, (file) => file.message)
  attachments: Attachment[];
}
