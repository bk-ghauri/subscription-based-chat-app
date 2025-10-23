import { ConversationRole } from '../types/conversation-member.enum';

export class ConversationMemberResponse {
  id: string;
  displayName: string;
  avatar?: string | null;
  role: ConversationRole;
}
