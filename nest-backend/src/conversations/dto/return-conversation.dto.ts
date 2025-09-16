import { ConvMemberDto } from '@app/conversation-members/dto/conversation-member.dto';
import { CreatedByDto } from './created-by.dto';
import { ApiProperty } from '@nestjs/swagger';

export class ReturnConversationDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  name: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ type: CreatedByDto })
  createdBy: CreatedByDto | null;

  @ApiProperty({ type: [ConvMemberDto] })
  members: ConvMemberDto[];
}
