import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { DataSource, In, Repository } from 'typeorm';
import { ConversationMember } from '@app/conversation-members/entities/conversation-member.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Conversation } from './entities/conversation.entity';
import { User } from '@app/users/entities/user.entity';
import { ConversationMemberResponse } from '@app/conversation-members/responses/conversation-member';
import { ConversationMembersService } from '@app/conversation-members/conversation-members.service';
import { UsersService } from '@app/users/users.service';
import { ConversationTypeEnum } from './types/conversation.enum';
import { ConversationResponse } from './responses/conversation-response';
import { ConversationRole } from '@app/conversation-members/types/conversation-member.enum';
import { AccountRole } from '@app/account-types/types/account-type.enum';
import { ConversationCreatorResponse } from './responses/conversation-creator-response';
import { AddMembersDto } from './dto/add-members.dto';
import { AccountTypesService } from '@app/account-types/account-types.service';
import { ErrorMessages } from '@app/common/strings/error-messages';
import { SuccessMessages } from '@app/common/strings/success-messages';

@Injectable()
export class ConversationsService {
  private readonly logger = new Logger(ConversationsService.name);

  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,

    private readonly accountTypeService: AccountTypesService,
    private readonly conversationMemberService: ConversationMembersService,
    private readonly userService: UsersService,
    private readonly dataSource: DataSource,
  ) {}

  // Helper: format response

  private toConversationResponse(
    conversation: Conversation,
    memberRows: ConversationMember[],
  ): ConversationResponse {
    const members: ConversationMemberResponse[] = memberRows.map((r) => ({
      id: r.userId,
      displayName: r.user.displayName,
      avatar: r.user.avatarUrl,
      role: r.conversationRole as ConversationRole,
    }));

    const createdBy: ConversationCreatorResponse | null = conversation.createdBy
      ? {
          id: conversation.createdBy.id,
          displayName: conversation.createdBy.displayName,
          avatar: conversation.createdBy.avatarUrl,
        }
      : null;

    const response: ConversationResponse = {
      id: conversation.id,
      type: conversation.type,
      name: conversation.name ?? null,
      createdAt: conversation.createdAt,
      createdBy,
      members,
    };

    return response;
  }

  private validateDm(userId: string, dto: CreateConversationDto) {
    if (dto.type !== ConversationTypeEnum.DM) {
      throw new BadRequestException(ErrorMessages.invalidConversationType);
    }
    if (!dto.memberIds || dto.memberIds.length !== 1) {
      throw new BadRequestException(ErrorMessages.invalidMemberCount);
    }
    const otherUserId = dto.memberIds[0];
    if (otherUserId === userId) {
      throw new BadRequestException(ErrorMessages.dmWithSelf);
    }
  }

  // load members & createdBy to create a proper response
  private async returnExistingDm(
    userId: string,
    otherUserId: string,
    existing: Conversation,
  ) {
    const conversation = await this.findOneWithCreator(existing.id);

    if (!conversation) {
      throw new NotFoundException(ErrorMessages.conversationNotFound);
    }

    const memberRows =
      await this.conversationMemberService.getMembersByConversationId(
        conversation.id,
      );

    return this.toConversationResponse(conversation, memberRows);
  }

  // DM creation (1:1)

  async createDmConversation(userId: string, dto: CreateConversationDto) {
    // Validate DTO type and members
    const otherUserId = dto.memberIds[0];
    this.validateDm(userId, dto);

    // 1) check if DM between these two users already exists
    const existing = await this.conversationRepository
      .createQueryBuilder('c')
      .innerJoin('c.members', 'm1', 'm1.user_id = :userId', { userId })
      .innerJoin('c.members', 'm2', 'm2.user_id = :otherUserId', {
        otherUserId,
      })
      .where('c.type = :type', { type: ConversationTypeEnum.DM })
      .getOne();

    if (existing) {
      return await this.returnExistingDm(userId, otherUserId, existing);
    }

    // Create new DM (transactional)
    return this.dataSource.transaction(async (manager) => {
      // validate both users exist
      const users = await manager.find(User, {
        where: { id: In([userId, otherUserId]) },
      });

      if (users.length !== 2) {
        throw new NotFoundException(ErrorMessages.userNotFound);
      }

      const createdByUser = users.find((u) => u.id === userId)!;

      const conversation = manager.create(Conversation, {
        type: ConversationTypeEnum.DM,
        name: null,
        createdBy: createdByUser,
      });

      const savedConversation = await manager.save(conversation);

      // memberships: creator and other user
      const rows = [
        manager.create(ConversationMember, {
          conversation: savedConversation,
          conversation_id: savedConversation.id,
          user_id: userId,
          user: users.find((u) => u.id === userId),
          conversation_role: ConversationRole.MEMBER,
        }),
        manager.create(ConversationMember, {
          conversation: savedConversation,
          conversation_id: savedConversation.id,
          user_id: otherUserId,
          user: users.find((u) => u.id === otherUserId),
          conversation_role: ConversationRole.MEMBER,
        }),
      ];

      await manager.save(rows);

      const memberRows = await manager.find(ConversationMember, {
        where: { conversationId: savedConversation.id },
        relations: { user: true },
      });

      // ensure createdBy is attached for response
      const conversationWithCreator = await manager.findOne(Conversation, {
        where: { id: savedConversation.id },
        relations: { createdBy: true },
      });

      return this.toConversationResponse(conversationWithCreator!, memberRows);
    });
  }

  private async validateGroup(userId: string, dto: CreateConversationDto) {
    if (dto.type !== ConversationTypeEnum.GROUP) {
      throw new BadRequestException(ErrorMessages.invalidConversationType);
    }

    // Only PREMIUM can create groups — check account type
    const acct = await this.accountTypeService.findOne(userId);

    const role = acct?.role ?? AccountRole.FREE;
    if (role !== AccountRole.PREMIUM) {
      throw new ForbiddenException(ErrorMessages.noGroupPrivilege);
    }

    // Normalize member IDs (unique + ensure creator included)
    const uniqueIds = Array.from(new Set(dto.memberIds || []));
    if (!uniqueIds.includes(userId)) uniqueIds.unshift(userId);

    // Validate members exist
    const users = await this.userService.findUsersByIds(uniqueIds);

    if (users.length !== uniqueIds.length) {
      throw new BadRequestException(ErrorMessages.userNotFound);
    }
    return { uniqueIds, users };
  }

  // Group creation
  async createGroupConversation(userId: string, dto: CreateConversationDto) {
    const validated = await this.validateGroup(userId, dto);

    const users = validated.users;
    const uniqueIds = validated.uniqueIds;

    // Create group conversation transactionally
    return this.dataSource.transaction(async (manager) => {
      const createdByUser = users.find((u) => u.id === userId)!;

      const conversation = manager.create(Conversation, {
        type: ConversationTypeEnum.GROUP,
        name: dto.name ?? null,
        createdBy: createdByUser,
      });

      const savedConversation = await manager.save(conversation);

      // create membership rows, creator becomes ADMIN
      const rows = users.map((u) =>
        manager.create(ConversationMember, {
          conversation: savedConversation,
          conversationId: savedConversation.id,
          userId: u.id,
          user: u,
          conversationRole:
            u.id === userId ? ConversationRole.ADMIN : ConversationRole.MEMBER,
        }),
      );

      await manager.save(rows);

      const memberRows = await manager.find(ConversationMember, {
        where: { conversationId: savedConversation.id },
        relations: { user: true },
      });

      const conversationWithCreator = await manager.findOne(Conversation, {
        where: { id: savedConversation.id },
        relations: { createdBy: true },
      });

      return this.toConversationResponse(conversationWithCreator!, memberRows);
    });
  }

  async validateMembership(userId: string, conversationId: string) {
    const conversation = await this.findOne(conversationId);

    if (!conversation) {
      return { success: false, message: ErrorMessages.conversationNotFound };
    }

    const membership =
      await this.conversationMemberService.getConversationMembership(
        conversationId,
        userId,
      );

    if (!membership) {
      return {
        success: false,
        message: ErrorMessages.notConversationMember,
      };
    }

    return { success: true };
  }

  async findByUser(userId: string) {
    //Find all conversations user is in
    const memberships =
      await this.conversationMemberService.getUserMemberships(userId);

    // Group memberships by conversation Id
    const conversationMap = new Map<string, ConversationMember[]>();

    for (const membership of memberships) {
      const convId = membership.conversationId;

      if (!conversationMap.has(convId)) {
        conversationMap.set(convId, []);
      }

      conversationMap.get(convId)!.push(membership);
    }

    // Format each conversation using helper
    const response: ConversationResponse[] = Array.from(
      conversationMap.entries(),
    ).map(([_, memberRows]) => {
      const conversation = memberRows[0].conversation;
      return this.toConversationResponse(conversation, memberRows);
    });

    return response;
  }

  async deleteGroupMember(
    conversationId: string,
    userId: string,
    removedUserId: string,
  ) {
    // Load conversation
    const conversation = await this.findOne(conversationId);

    if (!conversation) {
      throw new NotFoundException(ErrorMessages.conversationNotFound);
    }

    if (conversation.type !== ConversationTypeEnum.GROUP) {
      throw new BadRequestException(ErrorMessages.cannotLeaveDm);
    }

    // Check both users are part of the conversation

    const userMembership =
      await this.conversationMemberService.getConversationMembership(
        conversationId,
        userId,
      );

    const removedUserMembership =
      await this.conversationMemberService.getConversationMembership(
        conversationId,
        removedUserId,
      );

    if (!userMembership) {
      throw new ForbiddenException(ErrorMessages.notConversationMember);
    }

    if (!removedUserMembership) {
      throw new ForbiddenException(ErrorMessages.notConversationMember);
    }

    const isAdmin = userMembership.conversationRole === ConversationRole.ADMIN;

    if (userId !== removedUserId && !isAdmin) {
      throw new ForbiddenException(ErrorMessages.notGroupAdmin);
    }

    if (userId === removedUserId && isAdmin) {
      throw new BadRequestException(ErrorMessages.adminCannotLeave);
    }

    await this.conversationMemberService.removeMember(
      conversationId,
      removedUserId,
    );

    return {
      success: true,
      message: SuccessMessages.memberRemoved,
    };
  }

  async addGroupMembers(
    userId: string,
    conversationId: string,
    dto: AddMembersDto,
  ) {
    // Load conversation
    const conversation = await this.findOne(conversationId);

    if (!conversation) {
      throw new NotFoundException(ErrorMessages.conversationNotFound);
    }

    if (conversation.type !== ConversationTypeEnum.GROUP) {
      throw new BadRequestException(ErrorMessages.invalidConversationType);
    }

    // Verify actor is a member
    const actorMembership =
      await this.conversationMemberService.getConversationMembership(
        conversationId,
        userId,
      );

    if (!actorMembership) {
      throw new ForbiddenException(ErrorMessages.notConversationMember);
    }

    if (actorMembership.conversationRole !== ConversationRole.ADMIN) {
      throw new ForbiddenException(ErrorMessages.notGroupAdmin);
    }

    // Validate provided users exist
    const users = await this.userService.findUsersByIds(dto.newMemberIds);
    if (users.length !== dto.newMemberIds.length) {
      throw new BadRequestException(ErrorMessages.userNotFound);
    }

    // Filter out users already in the group
    const existingMemberships =
      await this.conversationMemberService.getMembersByConversationId(
        conversationId,
      );
    const existingUserIds = new Set(existingMemberships.map((m) => m.userId));
    const filteredUsers = users.filter((u) => !existingUserIds.has(u.id));

    if (filteredUsers.length === 0) {
      return {
        success: true,
        message: SuccessMessages.userAlreadyMember,
      };
    }

    // Create new memberships
    await this.dataSource.transaction(async (manager) => {
      const rows = filteredUsers.map((u) =>
        manager.create(ConversationMember, {
          conversationId,
          userId: u.id,
          conversationRole: ConversationRole.MEMBER,
        }),
      );

      await manager.save(rows);
    });

    return {
      success: true,
      message: SuccessMessages.memberAdded,
    };
  }

  async findOneWithCreatorAndMembers(
    id: string,
  ): Promise<ConversationResponse> {
    const conversation = await this.findOneWithCreator(id);

    if (!conversation) {
      throw new NotFoundException(ErrorMessages.conversationNotFound);
    }

    const memberRows =
      await this.conversationMemberService.getMembersByConversationId(id);

    return this.toConversationResponse(conversation, memberRows);
  }

  async findOneWithCreator(id: string) {
    return await this.conversationRepository.findOne({
      where: { id },
      relations: { createdBy: true },
    });
  }

  async findOne(id: string) {
    return await this.conversationRepository.findOne({
      where: { id },
    });
  }
}
