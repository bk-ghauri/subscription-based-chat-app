import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { JwtAuthGuard } from '@app/auth/utils/Guards';

@UseGuards(JwtAuthGuard)
@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  // GET /conversations
  @Get()
  async getUserConversations(@Req() req) {
    const userId = req.user?.id;
    return this.conversationsService.findByUser(userId);
  }

  // POST /conversations/dm
  @Post('dm')
  async createDm(@Req() req: any, @Body() dto: CreateConversationDto) {
    console.log('Incoming DTO:', dto);
    const userId = req.user?.id;
    return this.conversationsService.createDmConversation(userId, dto);
  }

  // POST /conversations/group
  @Post('group')
  async createGroup(@Req() req: any, @Body() dto: CreateConversationDto) {
    const userId = req.user?.id;
    return this.conversationsService.createGroupConversation(userId, dto);
  }

  //  POST /groups/{groupId}/members

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.conversationsService.findOne(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.conversationsService.remove(+id);
  }
}
