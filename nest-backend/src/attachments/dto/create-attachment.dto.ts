import { Message } from '@app/messages/entities/message.entity';
import { User } from '@app/users/entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  isInt,
  IsMimeType,
  IsUrl,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CreateAttachmentDto {
  @ApiProperty()
  @IsUrl()
  fileUrl: string;

  @ApiProperty()
  @IsMimeType()
  fileType: string;

  @ApiProperty()
  @IsInt()
  @Max(50 * 1024 * 1024)
  @Min(1)
  size: number;

  @ApiProperty()
  @IsUUID()
  uploaderId: string;
}
