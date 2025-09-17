import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class AddMembersDto {
  @ApiProperty()
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  newMemberIds: string[];
}
