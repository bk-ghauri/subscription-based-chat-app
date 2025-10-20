import { Attachment } from '@app/attachments/entities/attachment.entity';
import { BaseEntity } from '@app/common/entities/base.entity';
import { Message } from '@app/messages/entities/message.entity';
import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';

@Unique(['messageId', 'attachmentId'])
@Entity('message_attachments')
export class MessageAttachment extends BaseEntity {
  @Column({ type: 'uuid', name: 'message_id' })
  messageId: string;

  @ManyToOne(() => Message, (msg) => msg.attachmentLinks, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'message_id' })
  message: Message;

  @Column({ type: 'uuid', name: 'attachment_id' })
  attachmentId: string;

  @ManyToOne(() => Attachment, (att) => att.messageLinks, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'attachment_id' })
  attachment: Attachment;
}
