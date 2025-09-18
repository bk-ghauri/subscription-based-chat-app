import { ApiProperty } from '@nestjs/swagger';
import { ConversationRole } from '../types/conversation-member.enum';
import { IsEnum, isEnum, IsString, IsUrl, IsUUID } from 'class-validator';

export class ConversationMemberResponse {
  id: string;
  displayName: string;
  avatar: string | null;
  role: ConversationRole;
}
