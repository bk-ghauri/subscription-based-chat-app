import { MessageAttachmentResponse } from '@app/attachments/responses/message-attachment-response';
import { MessageSenderResponse } from './message-sender-response';
import { MessageStatusResponse } from '@app/message-status/responses/message-status-response';

export class MessageResponse {
  id: string;
  body?: string | null;
  createdAt: Date;
  sender: MessageSenderResponse;
  attachments?: MessageAttachmentResponse[];
  statuses: MessageStatusResponse[];
}
