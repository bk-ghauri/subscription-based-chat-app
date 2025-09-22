import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import {
  IsUrl,
  Length,
  IsInt,
  IsString,
  IsPositive,
  Max,
} from 'class-validator';
import { ValidationMessages } from '@app/common/strings/validation-messages';
import { MessageAttachment } from '@app/message-attachments/entities/message-attachment.entity';
import { BaseEntity } from '@app/common/entities/base.entity';

@Entity('attachments')
export class Attachment extends BaseEntity {
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
  @Max(50 * 1024 * 1024, { message: ValidationMessages.fileTooLarge })
  size: number;

  @ManyToOne(() => User, (user) => user.attachments, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'uploader_id' })
  uploader: User;

  @OneToMany(() => MessageAttachment, (ma) => ma.attachment)
  messageLinks: MessageAttachment[];
}
