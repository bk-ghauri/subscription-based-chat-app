import { ConversationRole } from '../types/conversation-member.enum';

export class ConvMemberDto {
  id: string;
  displayName: string;
  avatar: string | null;
  role: ConversationRole;
}
