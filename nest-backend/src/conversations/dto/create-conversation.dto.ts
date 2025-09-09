import {
  IsArray,
  ArrayNotEmpty,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateConversationDto {
  @IsEnum(['DM', 'GROUP'])
  type: 'DM' | 'GROUP';

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
