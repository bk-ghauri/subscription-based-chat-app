import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { AddMembersDto } from './dto/add-members.dto';
import { JwtAuthGuard } from '@app/auth/utils/Guards';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { ConversationResponse } from './responses/conversation-response';
import { UserId } from '@app/common/decorators/user-id.decorator';

@UseGuards(JwtAuthGuard)
@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  // Get all conversations user is a part of

  @Get()
  @ApiOperation({ summary: 'Return all conversations of the user' })
  @ApiOkResponse({
    description: 'Conversations returned',
    type: ConversationResponse,
  })
  @ApiBearerAuth()
  async getUserConversations(@UserId() userId: string) {
    return this.conversationsService.findByUser(userId);
  }

  // Start a new DM

  @Post('dm')
  @ApiOperation({ summary: 'Create a new direct message (DM)' })
  @ApiOkResponse({
    description: 'DM created',
    type: ConversationResponse,
  })
  @ApiBadRequestResponse({ description: 'Invalid details' })
  @ApiNotFoundResponse({ description: 'Invalid user IDs' })
  @ApiBody({ type: CreateConversationDto })
  @ApiBearerAuth()
  async createDm(@UserId() userId: string, @Body() dto: CreateConversationDto) {
    return this.conversationsService.createDmConversation(userId, dto);
  }

  // Create new group

  @Post('group')
  @ApiOperation({ summary: 'Create a new group' })
  @ApiOkResponse({
    description: 'Group created',
    type: ConversationResponse,
  })
  @ApiBadRequestResponse({
    description: 'Invalid users IDs or conversation type',
  })
  @ApiForbiddenResponse({
    description: 'Only PREMIUM members can create groups',
  })
  @ApiBody({ type: CreateConversationDto })
  @ApiBearerAuth()
  async createGroup(
    @UserId() userId: string,
    @Body() dto: CreateConversationDto,
  ) {
    return this.conversationsService.createGroupConversation(userId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'View a conversation with members' })
  @ApiOkResponse({ description: 'Conversation returned' })
  @ApiNotFoundResponse({ description: 'Conversation not found' })
  @ApiBearerAuth()
  async findOne(@Param('id') id: string) {
    return this.conversationsService.findOneWithCreatorAndMembers(id);
  }

  @Patch(':id/members')
  @ApiOperation({ summary: 'Add members to an existing group' })
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Members added successfully' })
  @ApiNotFoundResponse({ description: 'Conversation not found' })
  @ApiBadRequestResponse({
    description: 'Cannot add members to this conversation',
  })
  @ApiForbiddenResponse({
    description: 'You are not allowed to add members to this group',
  })
  @ApiBody({ type: AddMembersDto })
  async addGroupMembers(
    @UserId() userId: string,
    @Param('id') conversationId: string,
    @Body() dto: AddMembersDto,
  ) {
    return this.conversationsService.addGroupMembers(
      userId,
      conversationId,
      dto,
    );
  }

  @Delete(':id/members/:removedUserId')
  @ApiOperation({ summary: 'Remove a group member/leave group' })
  @ApiOkResponse({ description: 'Removed group member successfully' })
  @ApiNotFoundResponse({ description: 'Conversation not found' })
  @ApiBadRequestResponse({ description: `Cannot leave this conversation` })
  @ApiForbiddenResponse({ description: 'Only admin can delete other members' })
  @ApiBearerAuth()
  async deleteGroupMember(
    @UserId() userId: string,
    @Param('id') conversationId: string,
    @Param('removedUserId') removedUserId: string,
  ) {
    return this.conversationsService.deleteGroupMember(
      conversationId,
      userId,
      removedUserId,
    );
  }
}
