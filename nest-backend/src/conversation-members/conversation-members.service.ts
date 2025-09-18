import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConversationMember } from './entities/conversation-member.entity';
import { Repository } from 'typeorm';
import { ErrorMessages } from '@app/common/constants/error-messages';

@Injectable()
export class ConversationMembersService {
  constructor(
    @InjectRepository(ConversationMember)
    private readonly conversationMemberRepository: Repository<ConversationMember>,
  ) {}

  async getMembersByConversationId(conversationId: string) {
    return await this.conversationMemberRepository.find({
      where: { conversationId },
      relations: { user: true },
    });
  }

  async getConversationMembership(conversationId: string, userId: string) {
    return await this.conversationMemberRepository.findOneBy({
      conversationId,
      userId,
    });
  }

  async getUserMemberships(userId: string) {
    return await this.conversationMemberRepository.find({
      where: { userId },
      relations: {
        user: true,
        conversation: {
          members: true,
          createdBy: true,
        },
      },
      order: {
        conversation: {
          createdAt: 'DESC',
        },
      },
    });
  }

  async removeMember(conversationId: string, userId: string) {
    const member = await this.conversationMemberRepository.findOneBy({
      conversationId,
      userId,
    });
    if (!member) {
      throw new NotFoundException(ErrorMessages.conversationMemberNotFound);
    }
    await this.conversationMemberRepository.remove(member);
  }
}
