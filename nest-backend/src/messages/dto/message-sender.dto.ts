import { ApiProperty } from '@nestjs/swagger';

export class MessageSenderDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  displayName: string;

  @ApiProperty()
  avatar?: string | null;
}
