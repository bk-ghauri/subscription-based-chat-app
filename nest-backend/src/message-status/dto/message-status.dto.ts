import { ApiProperty } from '@nestjs/swagger';
import { MessageStatusEnum } from '../types/message-status.enum';

export class MessageStatusDto {
  @ApiProperty()
  receiverId: string;

  @ApiProperty()
  status: MessageStatusEnum;

  @ApiProperty()
  deliveredAt: Date | null;

  @ApiProperty()
  readAt: Date | null;
}
