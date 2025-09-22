import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '@app/auth/utils/Guards';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { MessageResponse } from './responses/message-response';

@Controller('conversations/:conversationId/messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  @ApiOperation({ summary: 'Get paginated messages from a conversation' })
  @ApiParam({ name: 'conversationId' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of messages per page (default: 20)',
  })
  @ApiOkResponse({
    description: 'List of messages fetched',
    type: [MessageResponse],
  })
  @ApiBearerAuth()
  async getMessages(
    @Param('conversationId') conversationId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.messagesService.findMessagesByConversation(
      conversationId,
      +page,
      +limit,
    );
  }
}
