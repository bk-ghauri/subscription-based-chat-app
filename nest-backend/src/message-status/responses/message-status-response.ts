import { MessageStatusEnum } from '../types/message-status.enum';

export class MessageStatusResponse {
  receiverId: string;
  status: MessageStatusEnum;
  deliveredAt: Date | null;
  readAt: Date | null;
}
