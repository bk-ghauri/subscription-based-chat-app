import { ConversationMemberResponse } from '@app/conversation-members/responses/conversation-member';
import { ConversationCreatorResponse } from './conversation-creator-response';
import { ConversationTypeEnum } from '../types/conversation.enum';

export class ConversationResponse {
  id: string;
  type: ConversationTypeEnum;
  name?: string | null;
  createdAt: Date;
  createdBy: ConversationCreatorResponse | null;
  members: ConversationMemberResponse[];
}
