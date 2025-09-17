import { ApiProperty } from '@nestjs/swagger';
import { ConversationRole } from '../types/conversation-member.enum';
import { IsEnum, isEnum, IsString, IsUrl, IsUUID } from 'class-validator';

export class ConvMemberDto {
  @ApiProperty()
  @IsUUID()
  id: string;

  @ApiProperty()
  @IsString()
  displayName: string;

  @ApiProperty()
  @IsUrl()
  avatar: string | null;

  @ApiProperty()
  @IsEnum(ConversationRole)
  role: ConversationRole;
}
