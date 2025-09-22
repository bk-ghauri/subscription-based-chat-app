import { MaxTextLength } from '@app/common/validators/max-text-length';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateMessageDto {
  @IsString()
  @MaxTextLength(5000)
  body: string;

  @IsUUID()
  senderId: string;

  @IsUUID()
  conversationId: string;

  @IsOptional()
  @IsUUID()
  attachmentId?: string;
}
