import { Attachment } from '@app/attachments/entities/attachment.entity';
import { Message } from '@app/messages/entities/message.entity';
import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

@Entity('message_attachments')
export class MessageAttachment {
  @PrimaryColumn({ type: 'uuid', name: 'message_id' })
  messageId: string;

  @ManyToOne(() => Message, (msg) => msg.attachmentLinks, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'message_id' })
  message: Message;

  @PrimaryColumn({ type: 'uuid', name: 'attachment_id' })
  attachmentId: string;

  @ManyToOne(() => Attachment, (att) => att.messageLinks, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'attachment_id' })
  attachment: Attachment;
}
