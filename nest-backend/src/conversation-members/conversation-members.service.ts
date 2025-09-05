import { Injectable } from '@nestjs/common';
import { CreateConversationMemberDto } from './dto/create-conversation-member.dto';
import { UpdateConversationMemberDto } from './dto/update-conversation-member.dto';

@Injectable()
export class ConversationMembersService {
  create(createConversationMemberDto: CreateConversationMemberDto) {
    return 'This action adds a new conversationMember';
  }

  findAll() {
    return `This action returns all conversationMembers`;
  }

  findOne(id: number) {
    return `This action returns a #${id} conversationMember`;
  }

  update(id: number, updateConversationMemberDto: UpdateConversationMemberDto) {
    return `This action updates a #${id} conversationMember`;
  }

  remove(id: number) {
    return `This action removes a #${id} conversationMember`;
  }
}
