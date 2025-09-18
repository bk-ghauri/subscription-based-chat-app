import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUrl, IsUUID } from 'class-validator';

export class ConversationCreatorResponse {
  id: string;
  displayName: string;
  avatar?: string | null;
}
