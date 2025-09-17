import {
  IsArray,
  ArrayNotEmpty,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ConversationTypeEnum } from '../types/conversation.enum';
import { ApiProperty } from '@nestjs/swagger';

export class CreateConversationDto {
  @ApiProperty()
  @IsEnum(ConversationTypeEnum)
  type: ConversationTypeEnum;

  @ApiProperty()
  @IsOptional()
  @IsString()
  name?: string; // optional for group chat metadata

  @ApiProperty()
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  memberIds: string[];
}
