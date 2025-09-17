import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToOne,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Message } from '@app/messages/entities/message.entity';
import {
  IsUrl,
  Length,
  IsInt,
  IsString,
  IsPositive,
  Max,
  IsDate,
} from 'class-validator';

@Entity('attachments')
@Unique(['message'])
export class Attachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 500 })
  @IsUrl()
  @Length(5, 500)
  fileUrl: string;

  @Column({ type: 'varchar', length: 50 })
  @IsString()
  @Length(1, 50)
  fileType: string;

  @Column({ type: 'int' })
  @IsInt()
  @IsPositive()
  @Max(50 * 1024 * 1024, { message: 'File cannot exceed 50 MB' })
  size: number;

  @IsDate()
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ name: 'uploader_id', nullable: true })
  uploaderId: string;

  @ManyToOne(() => User, (user) => user.attachments, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'uploader_id' })
  uploader: User;

  @Column({ name: 'message_id', nullable: true })
  messageId: string | null;

  @OneToOne(() => Message, (msg) => msg.attachment, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'message_id' })
  message: Message | null;
}
