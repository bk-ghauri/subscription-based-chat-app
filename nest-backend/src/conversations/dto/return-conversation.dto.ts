import { ConvMemberDto } from '@app/conversation-members/dto/conversation-member.dto';
import { CreatedByDto } from './created-by.dto';

export class ReturnConversationDto {
  id: string;
  type: string;
  name: string | null;
  createdAt: Date;
  createdBy?: CreatedByDto;
  members: ConvMemberDto[];
}
