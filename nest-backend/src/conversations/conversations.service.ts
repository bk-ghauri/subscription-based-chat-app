import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { DataSource, In, Repository } from 'typeorm';
import { ConversationMember } from '@app/conversation-members/entities/conversation-member.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Conversation } from './entities/conversation.entity';
import { User } from '@app/users/entities/User';
import { AccountType } from '@app/typeorm/entities/AccountType';
import { ConvMemberDto } from '@app/conversation-members/dto/conversation-member.dto';
import { ConversationMembersService } from '@app/conversation-members/conversation-members.service';
import { UserService } from '@app/users/users.service';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,

    @InjectRepository(AccountType)
    private readonly accountTypeRepository: Repository<AccountType>,

    private readonly conversationMemberService: ConversationMembersService,
    private readonly userService: UserService,
    private readonly dataSource: DataSource,
    private readonly logger = new Logger(ConversationsService.name),
  ) {}

  // Helper: format response

  private formatConversationResponse(
    conv: Conversation,
    memberRows: ConversationMember[],
  ) {
    const members: ConvMemberDto[] = (memberRows || []).map((r) => ({
      id: r.user.user_id,
      displayName: r.user.display_name,
      avatar: r.user.avatar_url ?? null,
      role: r.conversation_role as 'ADMIN' | 'MEMBER',
      statusMessage: r.status_message ?? null,
    }));

    return {
      id: conv.conversation_id,
      type: conv.type,
      name: conv.name ?? null,
      createdAt: conv.created_at,
      createdBy: conv.created_by && {
        id: conv.created_by.user_id,
        displayName: conv.created_by.display_name,
        avatar: conv.created_by.avatar_url ?? null,
      },
      members,
    };
  }

  // DM creation (1:1) — dedupe

  async createDmConversation(userId: string, dto: CreateConversationDto) {
    // Validate DTO type and members
    if (dto.type !== 'DM') {
      throw new BadRequestException(
        `DTO type must be "DM" for a direct message.`,
      );
    }
    if (!dto.memberIds || dto.memberIds.length !== 1) {
      throw new BadRequestException(
        'DM must contain exactly one other user in memberIds.',
      );
    }

    const otherUserId = dto.memberIds[0];

    if (otherUserId === userId) {
      throw new BadRequestException("You can't create a DM with yourself.");
    }

    // 1) check if DM between these two users already exists
    const existing = await this.conversationRepository
      .createQueryBuilder('c')
      .innerJoin('c.members', 'm1', 'm1.user_id = :userId', { userId })
      .innerJoin('c.members', 'm2', 'm2.user_id = :otherUserId', {
        otherUserId,
      })
      .where('c.type = :type', { type: 'DM' })
      .getOne();

    if (existing) {
      // load members & created_by to create a proper response
      const conv = await this.conversationRepository.findOne({
        where: { conversation_id: existing.conversation_id },
        relations: ['created_by'],
      });

      if (!conv) {
        throw new NotFoundException(
          'Conversation not found after initial query.',
        );
      }

      const memberRows =
        await this.conversationMemberService.getMembersByConversationId(
          conv.conversation_id,
        );

      this.logger.log(
        `DM between ${userId} and ${otherUserId} already exists.`,
      );
      return this.formatConversationResponse(conv, memberRows);
    }

    // Create new DM (transactional)
    return this.dataSource.transaction(async (manager) => {
      // validate both users exist
      const users = await manager.find(User, {
        where: { user_id: In([userId, otherUserId]) },
      });
      if (users.length !== 2) {
        throw new NotFoundException('One or both users do not exist.');
      }

      const createdByUser = users.find((u) => u.user_id === userId)!;

      const conv = manager.create(Conversation, {
        type: 'DM',
        name: null,
        created_by: createdByUser,
      });

      const savedConv = await manager.save(conv);

      // memberships: creator and other user
      const rows = [
        manager.create(ConversationMember, {
          conversation: savedConv,
          conversation_id: savedConv.conversation_id,
          user_id: userId,
          user: users.find((u) => u.user_id === userId),
          conversation_role: 'MEMBER',
        }),
        manager.create(ConversationMember, {
          conversation: savedConv,
          conversation_id: savedConv.conversation_id,
          user_id: otherUserId,
          user: users.find((u) => u.user_id === otherUserId),
          conversation_role: 'MEMBER',
        }),
      ];

      await manager.save(rows);

      const memberRows = await manager.find(ConversationMember, {
        where: { conversation_id: savedConv.conversation_id },
        relations: ['user'],
      });

      // ensure created_by is attached for response
      const convWithCreator = await manager.findOne(Conversation, {
        where: { conversation_id: savedConv.conversation_id },
        relations: ['created_by'],
      });

      return this.formatConversationResponse(convWithCreator!, memberRows);
    });
  }

  // Group creation
  async createGroupConversation(userId: string, dto: CreateConversationDto) {
    if (dto.type !== 'GROUP') {
      throw new BadRequestException(
        'DTO type must be "GROUP" for group conversations.',
      );
    }

    // Only PREMIUM can create groups — check account type
    const acct = await this.accountTypeRepository.findOne({
      where: { user_id: userId },
    });
    const role = acct?.role ?? 'FREE';
    if (role !== 'PREMIUM') {
      throw new ForbiddenException(
        'Only PREMIUM users can create group conversations.',
      );
    }

    // Normalize member IDs (unique + ensure creator included)
    const uniqueIds = Array.from(new Set(dto.memberIds || []));
    if (!uniqueIds.includes(userId)) uniqueIds.unshift(userId);

    // Validate members exist
    const users = await this.userService.findUsersByIds(uniqueIds);

    if (users.length !== uniqueIds.length) {
      throw new BadRequestException('One or more memberIds are invalid.');
    }

    // Create group conversation transactionally
    return this.dataSource.transaction(async (manager) => {
      const createdByUser = users.find((u) => u.user_id === userId)!;

      const conv = manager.create(Conversation, {
        type: 'GROUP',
        name: dto.name ?? null,
        created_by: createdByUser,
      });

      const savedConv = await manager.save(conv);

      // create membership rows, creator becomes ADMIN
      const rows = users.map((u) =>
        manager.create(ConversationMember, {
          conversation: savedConv,
          conversation_id: savedConv.conversation_id,
          user_id: u.user_id,
          user: u,
          conversation_role: u.user_id === userId ? 'ADMIN' : 'MEMBER',
        }),
      );

      await manager.save(rows);

      const memberRows = await manager.find(ConversationMember, {
        where: { conversation_id: savedConv.conversation_id },
        relations: ['user'],
      });

      const convWithCreator = await manager.findOne(Conversation, {
        where: { conversation_id: savedConv.conversation_id },
        relations: ['created_by'],
      });

      return this.formatConversationResponse(convWithCreator!, memberRows);
    });
  }

  async validateMembership(userId: string, conversationId: string) {
    const conversation = await this.conversationRepository.findOne({
      where: { conversation_id: conversationId },
    });

    if (!conversation) {
      return { success: false, message: 'Conversation not found' };
    }

    const membership =
      await this.conversationMemberService.getConversationMembership(
        conversationId,
        userId,
      );

    if (!membership) {
      return {
        success: false,
        message: 'You are not a member of this conversation',
      };
    }

    return { success: true };
  }

  async findByUser(userId: string) {
    const memberships =
      await this.conversationMemberService.getUserMemberships(userId);

    return memberships.map((m) => ({
      id: m.conversation.conversation_id,
      type: m.conversation.type,
      name: m.conversation.name,
      createdAt: m.conversation.created_at,
      createdBy: {
        id: m.conversation.created_by.user_id,
        displayName: m.conversation.created_by.display_name,
      },
    }));
  }

  findAll() {
    return `This action returns all conversations`;
  }

  findOne(id: string) {
    return this.conversationRepository.findOne({
      where: { conversation_id: id },
      relations: ['created_by'],
    []
    });
  }

  update(id: number, updateConversationDto: UpdateConversationDto) {
    return `This action updates a #${id} conversation`;
  }

  remove(id: number) {
    return `This action removes a #${id} conversation`;
  }
}
