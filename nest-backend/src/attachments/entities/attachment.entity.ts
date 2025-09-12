import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
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

@Entity()
export class Attachment {
  @PrimaryGeneratedColumn('uuid')
  attachment_id: string;

  @Column({ type: 'varchar', length: 500 })
  @IsUrl()
  @Length(5, 500)
  file_url: string;

  @Column({ type: 'varchar', length: 50 })
  @IsString()
  @Length(1, 50)
  file_type: string;

  @Column({ type: 'int' })
  @IsInt()
  @IsPositive()
  @Max(50 * 1024 * 1024, { message: 'File cannot exceed 50 MB' })
  size: number;

  @IsDate()
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @ManyToOne(() => User, (user) => user.attachments, { onDelete: 'SET NULL' })
  uploader_id: User;

  @ManyToOne(() => Message, (msg) => msg.attachments, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  message: Message;
}
