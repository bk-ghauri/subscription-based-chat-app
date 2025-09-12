import {
  IsArray,
  ArrayNotEmpty,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ConversationTypeEnum } from '../types/conversation.enum';

export class CreateConversationDto {
  @IsEnum(ConversationTypeEnum)
  type: ConversationTypeEnum;

  @IsOptional()
  @IsString()
  name?: string; // optional for group chat metadata

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  memberIds: string[];
}

export class AddMembersDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  userIds: string[];
}
