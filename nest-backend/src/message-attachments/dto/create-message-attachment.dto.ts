import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreateMessageAttachmentDto {
  @IsUUID()
  @IsNotEmpty()
  messageId: string;

  @IsUUID()
  @IsNotEmpty()
  attachmentId: string;
}
