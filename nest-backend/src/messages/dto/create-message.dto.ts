import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateMessageDto {
  @IsString()
  body: string;

  @IsUUID()
  senderId: string;

  @IsUUID()
  conversationId: string;

  @IsOptional()
  @IsUUID()
  attachmentId?: string;
}
