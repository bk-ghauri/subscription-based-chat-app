import { IsString, IsUUID } from 'class-validator';

export class CreateMessageDto {
  @IsString()
  body: string;

  @IsUUID()
  senderId: string;

  @IsUUID()
  conversationId: string;
}
