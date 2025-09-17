import { MessageAttachmentDto } from '@app/attachments/dto/message-attachment.dto';
import { ApiProperty } from '@nestjs/swagger';
import { MessageSenderDto } from './message-sender.dto';
import { MessageStatusDto } from '@app/message-status/dto/message-status.dto';

export class ReturnMessageDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  body?: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ type: MessageSenderDto })
  sender: MessageSenderDto;

  @ApiProperty({ type: [MessageAttachmentDto] })
  attachments?: MessageAttachmentDto[];

  @ApiProperty({ type: [MessageStatusDto] })
  statuses: MessageStatusDto[];
}
