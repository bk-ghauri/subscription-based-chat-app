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
import { AccountType } from '@app/account-type/entities/account-type.entity';
import { ConvMemberDto } from '@app/conversation-members/dto/conversation-member.dto';
import { ConversationMembersService } from '@app/conversation-members/conversation-members.service';
import { UserService } from '@app/users/users.service';
import { ConversationTypeEnum } from './types/conversation.enum';
import { ReturnConversationDto } from './dto/return-conversation.dto';
import { ConversationRole } from '@app/conversation-members/types/conversation-member.enum';
import { AccountRole } from '@app/account-type/types/account-type.enum';
import { CreatedByDto } from './dto/created-by.dto';
import { AddMembersDto } from './dto/add-members.dto';

@Injectable()
export class ConversationsService {
  private readonly logger = new Logger(ConversationsService.name);

  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,

    @InjectRepository(AccountType)
    private readonly accountTypeRepository: Repository<AccountType>,

    private readonly conversationMemberService: ConversationMembersService,
    private readonly userService: UserService,
    private readonly dataSource: DataSource,
  ) {}

  // Helper: format response

  private toConversationResponseDto(
    conv: Conversation,
    memberRows: ConversationMember[],
  ): ReturnConversationDto {
    const members: ConvMemberDto[] = memberRows.map((r) => ({
      id: r.user.user_id,
      displayName: r.user.display_name,
      avatar: r.user.avatar_url,
      role: r.conversation_role as ConversationRole,
    }));

    const createdBy: CreatedByDto = {
      id: conv.created_by.user_id,
      displayName: conv.created_by.display_name,
      avatar: conv.created_by.avatar_url,
    };

    const response: ReturnConversationDto = {
      id: conv.conversation_id,
      type: conv.type,
      name: conv.name ?? null,
      createdAt: conv.created_at,
      createdBy,
      members,
    };

    return response;
  }

  private validateDm(userId: string, dto: CreateConversationDto) {
    if (dto.type !== ConversationTypeEnum.DM) {
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
  }

  // load members & created_by to create a proper response
  private async returnExistingDm(
    userId: string,
    otherUserId: string,
    existing: Conversation,
  ) {
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

    this.logger.log(`DM between ${userId} and ${otherUserId} already exists.`);
    return this.toConversationResponseDto(conv, memberRows);
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
        where: { user_id: In([userId, otherUserId]) },
      });

      if (users.length !== 2) {
        throw new NotFoundException('One or both users do not exist.');
      }

      const createdByUser = users.find((u) => u.user_id === userId)!;

      const conv = manager.create(Conversation, {
        type: ConversationTypeEnum.DM,
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
          conversation_role: ConversationRole.MEMBER,
        }),
        manager.create(ConversationMember, {
          conversation: savedConv,
          conversation_id: savedConv.conversation_id,
          user_id: otherUserId,
          user: users.find((u) => u.user_id === otherUserId),
          conversation_role: ConversationRole.MEMBER,
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

      return this.toConversationResponseDto(convWithCreator!, memberRows);
    });
  }

  private async validateGroup(userId: string, dto: CreateConversationDto) {
    if (dto.type !== ConversationTypeEnum.GROUP) {
      throw new BadRequestException(
        'DTO type must be "GROUP" for group conversations.',
      );
    }

    // Only PREMIUM can create groups — check account type
    const acct = await this.accountTypeRepository.findOne({
      where: { user_id: userId },
    });
    const role = acct?.role ?? AccountRole.FREE;
    if (role !== AccountRole.PREMIUM) {
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
    return { uniqueIds, users };
  }

  // Group creation
  async createGroupConversation(userId: string, dto: CreateConversationDto) {
    const validated = await this.validateGroup(userId, dto);

    const users = validated.users;
    const uniqueIds = validated.uniqueIds;

    // Create group conversation transactionally
    return this.dataSource.transaction(async (manager) => {
      const createdByUser = users.find((u) => u.user_id === userId)!;

      const conv = manager.create(Conversation, {
        type: ConversationTypeEnum.GROUP,
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
          conversation_role:
            u.user_id === userId
              ? ConversationRole.ADMIN
              : ConversationRole.MEMBER,
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

      return this.toConversationResponseDto(convWithCreator!, memberRows);
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
    //Find all conversations user is in
    const memberships =
      await this.conversationMemberService.getUserMemberships(userId);

    // Group memberships by conversation Id
    const conversationMap = new Map<string, ConversationMember[]>();

    for (const membership of memberships) {
      const convId = membership.conversation.conversation_id;

      if (!conversationMap.has(convId)) {
        conversationMap.set(convId, []);
      }

      conversationMap.get(convId)!.push(membership);
    }

    // Format each conversation using helper
    const response: ReturnConversationDto[] = Array.from(
      conversationMap.entries(),
    ).map(([_, memberRows]) => {
      const conversation = memberRows[0].conversation;
      return this.toConversationResponseDto(conversation, memberRows);
    });

    return response;
  }

  async deleteGroupMember(
    userId: string,
    conversationId: string,
    removedUserId: string,
  ) {
    // Load conversation
    const conv = await this.findOne(conversationId);

    if (!conv) {
      throw new NotFoundException('Conversation not found.');
    }

    if (conv.type !== ConversationTypeEnum.GROUP) {
      throw new BadRequestException('Only group conversations can be left.');
    }

    const membership =
      await this.conversationMemberService.getConversationMembership(
        conversationId,
        removedUserId,
      );

    if (!membership) {
      throw new ForbiddenException(
        'User is not a member of this conversation.',
      );
    }

    const isAdmin = membership.conversation_role === ConversationRole.ADMIN;

    if (userId !== removedUserId && !isAdmin) {
      throw new ForbiddenException('Only group admin can delete other users.');
    }

    if (userId === removedUserId && isAdmin) {
      throw new BadRequestException('Admin cannot leave the conversation.');
    }

    await this.conversationMemberService.removeMember(
      conversationId,
      removedUserId,
    );

    return {
      success: true,
      message: 'You left the conversation successfully.',
    };
  }

  async addGroupMembers(
    userId: string,
    conversationId: string,
    dto: AddMembersDto,
  ) {
    // Load conversation
    const conv = await this.findOne(conversationId);

    if (!conv) {
      throw new NotFoundException('Conversation not found.');
    }

    if (conv.type !== ConversationTypeEnum.GROUP) {
      throw new BadRequestException(
        'You can only add members to group conversations.',
      );
    }

    // Verify actor is a member
    const actorMembership =
      await this.conversationMemberService.getConversationMembership(
        conversationId,
        userId,
      );

    if (!actorMembership) {
      throw new ForbiddenException(
        'You are not a member of this conversation.',
      );
    }

    if (actorMembership.conversation_role !== ConversationRole.ADMIN) {
      throw new ForbiddenException('Only group admins can add members.');
    }
    // Validate provided users exist
    const users = await this.userService.findUsersByIds(dto.newMemberIds);
    if (users.length !== dto.newMemberIds.length) {
      throw new BadRequestException('One or more userIds are invalid.');
    }

    // Filter out users already in the group
    const existingMemberships =
      await this.conversationMemberService.getMembersByConversationId(
        conversationId,
      );
    const existingUserIds = new Set(existingMemberships.map((m) => m.user_id));
    const filteredUsers = users.filter((u) => !existingUserIds.has(u.user_id));

    if (filteredUsers.length === 0) {
      return {
        success: true,
        message: 'All provided users are already members.',
      };
    }

    // Create new memberships
    await this.dataSource.transaction(async (manager) => {
      const rows = filteredUsers.map((u) =>
        manager.create(ConversationMember, {
          conversation_id: conversationId,
          user_id: u.user_id,
          conversation_role: ConversationRole.MEMBER,
        }),
      );

      await manager.save(rows);
    });

    return {
      success: true,
      message: `${filteredUsers.length} member(s) added successfully.`,
    };
  }

  async findOneWithMembers(id: string): Promise<ReturnConversationDto> {
    const conv = await this.conversationRepository.findOne({
      where: { conversation_id: id },
      relations: ['created_by'],
    });

    if (!conv) {
      throw new NotFoundException(`Conversation ${id} not found`);
    }

    const memberRows =
      await this.conversationMemberService.getMembersByConversationId(id);

    return this.toConversationResponseDto(conv, memberRows);
  }

  findOne(id: string) {
    return this.conversationRepository.findOne({
      where: { conversation_id: id },
      relations: ['created_by'],
    });
  }
}
