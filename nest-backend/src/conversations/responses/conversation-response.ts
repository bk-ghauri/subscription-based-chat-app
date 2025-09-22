import { ConversationMemberResponse } from '@app/conversation-members/responses/conversation-member';
import { ConversationCreatorResponse } from './conversation-creator-response';
import { ApiProperty } from '@nestjs/swagger';

export class ConversationResponse {
  id: string;
  type: string;
  name: string | null;
  createdAt: Date;
  createdBy: ConversationCreatorResponse | null;
  members: ConversationMemberResponse[];
}
