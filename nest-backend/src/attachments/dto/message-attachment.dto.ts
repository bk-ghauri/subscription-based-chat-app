import { ApiProperty } from '@nestjs/swagger';

export class MessageAttachmentDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  url: string;
}
