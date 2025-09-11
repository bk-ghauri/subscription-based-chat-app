import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Message } from '@app/messages/entities/message.entity';

@Entity()
export class Attachment {
  @PrimaryGeneratedColumn('uuid')
  attachment_id: string;

  @Column()
  file_url: string;

  @Column()
  file_type: string;

  @Column()
  size: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @ManyToOne(() => User, (user) => user.attachments, { onDelete: 'SET NULL' })
  uploader_id: User;

  @ManyToOne(() => Message, (msg) => msg.attachments, { onDelete: 'CASCADE' })
  message: Message;
}
