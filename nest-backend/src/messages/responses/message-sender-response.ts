import { ApiProperty } from '@nestjs/swagger';

export class MessageSenderResponse {
  id: string;
  displayName: string;
  avatar?: string | null;
}
