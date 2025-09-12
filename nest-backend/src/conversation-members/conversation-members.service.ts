import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConversationMember } from './entities/conversation-member.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ConversationMembersService {
  constructor(
    @InjectRepository(ConversationMember)
    private readonly conversationMemberRepository: Repository<ConversationMember>,
  ) {}

  async getMembersByConversationId(conversationId: string) {
    return await this.conversationMemberRepository.find({
      where: { conversation_id: conversationId },
      relations: ['user'], // eager-load user details
    });
  }

  async getConversationMembership(conversationId: string, userId: string) {
    return await this.conversationMemberRepository.findOneBy({
      conversation_id: conversationId,
      user_id: userId,
    });
  }

  async getUserMemberships(userId: string) {
    return await this.conversationMemberRepository.find({
      where: { user_id: userId },
      relations: [
        'conversation',
        'conversation.members',
        'conversation.created_by',
      ],
      order: {
        conversation: {
          created_at: 'DESC',
        },
      },
    });
  }

  // findAll() {
  //   return `This action returns all conversationMembers`;
  // }

  // findOne(id: number) {
  //   return `This action returns a #${id} conversationMember`;
  // }

  // update(id: number, updateConversationMemberDto: UpdateConversationMemberDto) {
  //   return `This action updates a #${id} conversationMember`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} conversationMember`;
  // }
}
