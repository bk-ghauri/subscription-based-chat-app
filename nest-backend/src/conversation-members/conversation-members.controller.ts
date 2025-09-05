import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ConversationMembersService } from './conversation-members.service';
import { CreateConversationMemberDto } from './dto/create-conversation-member.dto';
import { UpdateConversationMemberDto } from './dto/update-conversation-member.dto';

@Controller('conversation-members')
export class ConversationMembersController {
  constructor(private readonly conversationMembersService: ConversationMembersService) {}

  @Post()
  create(@Body() createConversationMemberDto: CreateConversationMemberDto) {
    return this.conversationMembersService.create(createConversationMemberDto);
  }

  @Get()
  findAll() {
    return this.conversationMembersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.conversationMembersService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateConversationMemberDto: UpdateConversationMemberDto) {
    return this.conversationMembersService.update(+id, updateConversationMemberDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.conversationMembersService.remove(+id);
  }
}
