import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConversationMember } from './entities/conversation-member.entity';
import { Repository } from 'typeorm';
import { ConversationTypeEnum } from '@app/conversations/types/conversation.enum';
import { ConversationRole } from './types/conversation-member.enum';
import { ConversationsService } from '@app/conversations/conversations.service';

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

  async removeMember(conversationId: string, userId: string) {
    const member = await this.conversationMemberRepository.findOneBy({
      conversation_id: conversationId,
      user_id: userId,
    });
    if (!member) {
      throw new NotFoundException('Conversation member not found');
    }
    await this.conversationMemberRepository.remove(member);
  }
}
